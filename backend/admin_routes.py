from flask import (
    Blueprint,
    render_template,
    redirect,
    url_for,
    request,
    session,
    send_from_directory,
    jsonify,
    make_response,
)
from functools import wraps
from models import (
    db,
    Link,
    SiteIcon,
    WorkCard,
    CalculatorSettings,
    IntroButtonLink,
    ContactUsButtonLink,
    IntroBackground,
    ChatBotSettings,
    UmamiSettings,
    SupportRequest,
    PageContent,
    PromotionsPage,
)
from werkzeug.utils import secure_filename
import os
import logging
import requests
from datetime import datetime

UMAMI_API_BASE = "https://api.umami.is/v1"
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BASE_DIR)
DATA_DIR = os.path.join(PROJECT_ROOT, "data")
UPLOADS_DIR = os.path.join(DATA_DIR, "uploads")

os.makedirs(UPLOADS_DIR, exist_ok=True)

admin_bp = Blueprint("admin", __name__)

security_logger = logging.getLogger("security")

ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123")


def _get_upload_dir(*path_parts):
    upload_dir = os.path.join(UPLOADS_DIR, *path_parts)
    os.makedirs(upload_dir, exist_ok=True)
    return upload_dir


def _build_upload_url(*path_parts):
    cleaned_parts = [part.strip("/\\") for part in path_parts if part]
    return "/" + "/".join(["uploads", *cleaned_parts])


def is_logged_in():
    return session.get("admin_logged_in", False)


def require_login(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not is_logged_in():
            return redirect(url_for("admin.admin_login"))
        return f(*args, **kwargs)

    return decorated_function


@admin_bp.route("/admin-static/<path:filename>")
def admin_static(filename):
    admin_static_dir = os.path.join(BASE_DIR, "views", "src")
    return send_from_directory(admin_static_dir, filename)


@admin_bp.route("/admin/api/upload-icon", methods=["POST"])
@require_login
def upload_icon():
    try:
        if "file" not in request.files:
            return jsonify({"success": False, "message": "Файл не найден"}), 400

        file = request.files["file"]
        if file.filename == "":
            return jsonify({"success": False, "message": "Файл не выбран"}), 400

        allowed_extensions = {"png", "jpg", "jpeg", "gif", "svg", "webp", "ico"}
        filename = file.filename
        file_ext = filename.rsplit(".", 1)[1].lower() if "." in filename else ""

        if file_ext not in allowed_extensions:
            return (
                jsonify(
                    {
                        "success": False,
                        "message": f"Недопустимое расширение файла. Разрешены: {', '.join(allowed_extensions)}",
                    }
                ),
                400,
            )

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        safe_filename = secure_filename(filename)
        name_without_ext = safe_filename.rsplit(".", 1)[0] if "." in safe_filename else safe_filename
        unique_filename = f"{name_without_ext}_{timestamp}.{file_ext}"

        upload_dir = _get_upload_dir("icons")

        file_path = os.path.join(upload_dir, unique_filename)
        file.save(file_path)

        icon_path = _build_upload_url("icons", unique_filename)

        security_logger.info(f"Icon uploaded by IP: {request.remote_addr}, file: {unique_filename}")
        return jsonify(
            {
                "success": True,
                "message": "Иконка успешно загружена",
                "icon_path": icon_path,
            }
        )
    except Exception as e:
        security_logger.error(f"Error uploading icon: {str(e)}")
        return jsonify({"success": False, "message": "Ошибка при загрузке иконки"}), 500


@admin_bp.route("/admin")
@admin_bp.route("/admin/")
def admin_redirect():
    return redirect(url_for("admin.admin_panel"))


@admin_bp.route("/admin/login", methods=["GET", "POST"])
def admin_login():
    if is_logged_in():
        return redirect(url_for("admin.admin_panel"))

    error = None
    if request.method == "POST":
        password = request.form.get("password", "")
        client_ip = request.remote_addr

        if password == ADMIN_PASSWORD:
            session.clear()
            session["admin_logged_in"] = True
            session.permanent = True

            security_logger.info(f"Successful admin login from IP: {client_ip}")
            return redirect(url_for("admin.admin_panel"))
        else:
            security_logger.warning(f"Failed admin login attempt from IP: {client_ip}")
            error = "Неверный пароль"

    return render_template("admin_login.html", error=error)


@admin_bp.route("/admin/panel")
@require_login
def admin_panel():
    response = make_response(render_template("admin_panel.html"))
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response


@admin_bp.route("/admin/logout")
def admin_logout():
    session.pop("admin_logged_in", None)
    return redirect(url_for("admin.admin_login"))


@admin_bp.route("/admin/api/site-icon", methods=["GET"])
@require_login
def get_site_icon():
    site_icon = SiteIcon.query.first()
    return jsonify(
        {
            "success": True,
            "icon_path": site_icon.icon_path if site_icon else None,
        }
    )


@admin_bp.route("/admin/api/site-icon", methods=["PUT"])
@require_login
def update_site_icon():
    try:
        data = request.json
        icon_path = data.get("icon_path", "").strip()

        if not icon_path:
            return jsonify({"success": False, "message": "Путь к иконке обязателен"}), 400

        site_icon = SiteIcon.query.first()
        if site_icon:
            site_icon.icon_path = icon_path
        else:
            site_icon = SiteIcon(icon_path=icon_path)
            db.session.add(site_icon)

        db.session.commit()

        security_logger.info(f"Site icon updated by IP: {request.remote_addr}")
        return jsonify(
            {
                "success": True,
                "message": "Иконка сайта успешно обновлена",
                "icon_path": site_icon.icon_path,
            }
        )
    except Exception as e:
        db.session.rollback()
        security_logger.error(f"Error updating site icon: {str(e)}")
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Ошибка при обновлении иконки сайта",
                }
            ),
            500,
        )


@admin_bp.route("/admin/api/upload-site-icon", methods=["POST"])
@require_login
def upload_site_icon():
    try:
        if "file" not in request.files:
            return jsonify({"success": False, "message": "Файл не найден"}), 400

        file = request.files["file"]
        if file.filename == "":
            return jsonify({"success": False, "message": "Файл не выбран"}), 400

        allowed_extensions = {"png", "jpg", "jpeg", "gif", "svg", "webp", "ico"}
        filename = file.filename
        file_ext = filename.rsplit(".", 1)[1].lower() if "." in filename else ""

        if file_ext not in allowed_extensions:
            return (
                jsonify(
                    {
                        "success": False,
                        "message": f"Недопустимое расширение файла. Разрешены: {', '.join(allowed_extensions)}",
                    }
                ),
                400,
            )

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        safe_filename = secure_filename(filename)
        name_without_ext = safe_filename.rsplit(".", 1)[0] if "." in safe_filename else safe_filename
        unique_filename = f"site-icon_{name_without_ext}_{timestamp}.{file_ext}"

        upload_dir = _get_upload_dir("site")

        file_path = os.path.join(upload_dir, unique_filename)
        file.save(file_path)

        icon_path = _build_upload_url("site", unique_filename)

        site_icon = SiteIcon.query.first()
        if site_icon:
            site_icon.icon_path = icon_path
        else:
            site_icon = SiteIcon(icon_path=icon_path)
            db.session.add(site_icon)
        db.session.commit()

        security_logger.info(f"Site icon uploaded by IP: {request.remote_addr}, file: {unique_filename}")
        return jsonify(
            {
                "success": True,
                "message": "Иконка сайта успешно загружена",
                "icon_path": icon_path,
            }
        )
    except Exception as e:
        db.session.rollback()
        security_logger.error(f"Error uploading site icon: {str(e)}")
        return jsonify({"success": False, "message": "Ошибка при загрузке иконки сайта"}), 500

@admin_bp.route("/admin/api/intro-button-link", methods=["GET"])
@require_login
def get_intro_button_link():
    intro_link = IntroButtonLink.query.first()
    if intro_link:
        return jsonify({"success": True, "link": intro_link.link})
    return jsonify({"success": False, "message": "Ссылка кнопки 'Подробнее' не найдена"}), 404


@admin_bp.route("/admin/api/intro-button-link", methods=["PUT"])
@require_login
def update_intro_button_link():
    try:
        data = request.json
        link = data.get("link", "").strip()

        if not link:
            return jsonify({"success": False, "message": "Ссылка обязательна"}), 400

        if not (link.startswith("#") or link.startswith("http://") or link.startswith("https://") or link.startswith("/")):
            return jsonify({"success": False, "message": "Ссылка должна начинаться с #, http://, https:// или /"}), 400

        intro_link = IntroButtonLink.query.first()
        if intro_link:
            intro_link.link = link
        else:
            intro_link = IntroButtonLink(link=link)
            db.session.add(intro_link)
        
        db.session.commit()
        security_logger.info(f"Intro button link updated by IP: {request.remote_addr}")
        return jsonify({"success": True, "message": "Ссылка кнопки 'Подробнее' успешно обновлена", "link": intro_link.link})
    except Exception as e:
        db.session.rollback()
        security_logger.error(f"Error updating intro button link: {str(e)}")
        return jsonify({"success": False, "message": "Ошибка при обновлении ссылки кнопки 'Подробнее'"}), 500

@admin_bp.route("/admin/api/contact-us-button-link", methods=["GET"])
@require_login
def get_contact_us_button_link():
    contact_link = ContactUsButtonLink.query.first()
    if contact_link:
        return jsonify({"success": True, "link": contact_link.link})
    return jsonify({"success": False, "message": "Ссылка кнопки 'Вступить в команду' не найдена"}), 404


@admin_bp.route("/admin/api/contact-us-button-link", methods=["PUT"])
@require_login
def update_contact_us_button_link():
    try:
        data = request.json
        link = data.get("link", "").strip()

        if not link:
            return jsonify({"success": False, "message": "Ссылка обязательна"}), 400

        if not (link.startswith("#") or link.startswith("http://") or link.startswith("https://") or link.startswith("/")):
            return jsonify({"success": False, "message": "Ссылка должна начинаться с #, http://, https:// или /"}), 400

        contact_link = ContactUsButtonLink.query.first()
        if contact_link:
            contact_link.link = link
        else:
            contact_link = ContactUsButtonLink(link=link)
            db.session.add(contact_link)
        
        db.session.commit()
        security_logger.info(f"Contact us button link updated by IP: {request.remote_addr}")
        return jsonify({"success": True, "message": "Ссылка кнопки 'Вступить в команду' успешно обновлена", "link": contact_link.link})
    except Exception as e:
        db.session.rollback()
        security_logger.error(f"Error updating contact us button link: {str(e)}")
        return jsonify({"success": False, "message": "Ошибка при обновлении ссылки кнопки 'Вступить в команду'"}), 500

@admin_bp.route("/admin/api/intro-background", methods=["GET"])
@require_login
def get_intro_background():
    intro_bg = IntroBackground.query.first()
    if intro_bg:
        return jsonify({
            "success": True,
            "background_path": intro_bg.background_path,
            "background_type": intro_bg.background_type
        })
    return jsonify({"success": False, "message": "Фон первой секции не найден"}), 404


@admin_bp.route("/admin/api/upload-intro-background", methods=["POST"])
@require_login
def upload_intro_background():
    try:
        if "file" not in request.files:
            return jsonify({"success": False, "message": "Файл не найден"}), 400

        file = request.files["file"]
        if file.filename == "":
            return jsonify({"success": False, "message": "Файл не выбран"}), 400

        filename = file.filename
        file_ext = filename.rsplit(".", 1)[1].lower() if "." in filename else ""
        
        allowed_image_extensions = {"png", "jpg", "jpeg", "gif", "svg", "webp"}
        allowed_video_extensions = {"mp4", "webm", "ogg", "mov"}
        
        if file_ext not in allowed_image_extensions and file_ext not in allowed_video_extensions:
            return jsonify({
                "success": False,
                "message": f"Недопустимое расширение файла. Разрешены изображения: {', '.join(allowed_image_extensions)}, видео: {', '.join(allowed_video_extensions)}"
            }), 400

        background_type = "video" if file_ext in allowed_video_extensions else "image"
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        safe_filename = secure_filename(filename)
        name_without_ext = safe_filename.rsplit(".", 1)[0] if "." in safe_filename else safe_filename
        unique_filename = f"intro-bg_{name_without_ext}_{timestamp}.{file_ext}"

        if background_type == "video":
            upload_dir = _get_upload_dir("video")
        else:
            upload_dir = _get_upload_dir("main")

        file_path = os.path.join(upload_dir, unique_filename)
        file.save(file_path)

        if background_type == "video":
            background_path = _build_upload_url("video", unique_filename)
        else:
            background_path = _build_upload_url("main", unique_filename)

        intro_bg = IntroBackground.query.first()
        if intro_bg:
            intro_bg.background_path = background_path
            intro_bg.background_type = background_type
        else:
            intro_bg = IntroBackground(background_path=background_path, background_type=background_type)
            db.session.add(intro_bg)
        
        db.session.commit()

        security_logger.info(f"Intro background uploaded by IP: {request.remote_addr}, file: {unique_filename}, type: {background_type}")
        return jsonify({
            "success": True,
            "message": "Фон первой секции успешно загружен",
            "background_path": background_path,
            "background_type": background_type
        })
    except Exception as e:
        db.session.rollback()
        security_logger.error(f"Error uploading intro background: {str(e)}")
        return jsonify({"success": False, "message": "Ошибка при загрузке фона первой секции"}), 500

@admin_bp.route("/admin/api/links", methods=["GET"])
@require_login
def get_links():
    links_list = Link.query.order_by(Link.order).all()
    return jsonify(
        {
            "success": True,
            "links": [
                {
                    "id": link.id,
                    "text": link.text,
                    "url": link.url,
                    "icon": link.icon,
                    "order": link.order,
                }
                for link in links_list
            ],
        }
    )


@admin_bp.route("/admin/api/links", methods=["POST"])
@require_login
def create_link():
    try:
        data = request.json

        text = data.get("text", "").strip()
        url = data.get("url", "").strip()
        icon = data.get("icon", "").strip()
        order = data.get("order", 0)

        if not text:
            return jsonify({"success": False, "message": "Текст обязателен"}), 400

        if not url:
            return jsonify({"success": False, "message": "Ссылка обязательна"}), 400

        if not icon:
            return jsonify({"success": False, "message": "Иконка обязательна"}), 400

        if not url.startswith("http://") and not url.startswith("https://"):
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "Ссылка должна начинаться с http:// или https://",
                    }
                ),
                400,
            )

        link = Link(text=text, url=url, icon=icon, order=order)
        db.session.add(link)
        db.session.commit()

        security_logger.info(f"Link created by IP: {request.remote_addr}")
        return jsonify(
            {
                "success": True,
                "message": "Ссылка успешно создана",
                "link": {
                    "id": link.id,
                    "text": link.text,
                    "url": link.url,
                    "icon": link.icon,
                    "order": link.order,
                },
            }
        )
    except Exception as e:
        db.session.rollback()
        security_logger.error(f"Error creating link: {str(e)}")
        return jsonify({"success": False, "message": "Ошибка при создании ссылки"}), 500


@admin_bp.route("/admin/api/links/<int:link_id>", methods=["PUT"])
@require_login
def update_link(link_id):
    try:
        link = Link.query.get_or_404(link_id)
        data = request.json

        text = data.get("text", link.text).strip()
        url = data.get("url", link.url).strip()
        icon = data.get("icon", link.icon).strip()
        order = data.get("order", link.order)

        if not text:
            return jsonify({"success": False, "message": "Текст обязателен"}), 400

        if not url:
            return jsonify({"success": False, "message": "Ссылка обязательна"}), 400

        if not icon:
            return jsonify({"success": False, "message": "Иконка обязательна"}), 400

        if not url.startswith("http://") and not url.startswith("https://"):
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "Ссылка должна начинаться с http:// или https://",
                    }
                ),
                400,
            )

        link.text = text
        link.url = url
        link.icon = icon
        link.order = order

        db.session.commit()

        security_logger.info(f"Link {link_id} updated by IP: {request.remote_addr}")
        return jsonify(
            {
                "success": True,
                "message": "Ссылка успешно обновлена",
                "link": {
                    "id": link.id,
                    "text": link.text,
                    "url": link.url,
                    "icon": link.icon,
                    "order": link.order,
                },
            }
        )
    except Exception as e:
        db.session.rollback()
        security_logger.error(f"Error updating link: {str(e)}")
        return (
            jsonify({"success": False, "message": "Ошибка при обновлении ссылки"}),
            500,
        )


@admin_bp.route("/admin/api/links/<int:link_id>", methods=["DELETE"])
@require_login
def delete_link(link_id):
    try:
        link = Link.query.get_or_404(link_id)
        db.session.delete(link)
        db.session.commit()

        security_logger.info(f"Link {link_id} deleted by IP: {request.remote_addr}")
        return jsonify({"success": True, "message": "Ссылка успешно удалена"})
    except Exception as e:
        db.session.rollback()
        security_logger.error(f"Error deleting link: {str(e)}")
        return jsonify({"success": False, "message": "Ошибка при удалении ссылки"}), 500


@admin_bp.route("/admin/api/links/reorder", methods=["PUT"])
@require_login
def reorder_links():
    try:
        data = request.json
        links_order = data.get("order", [])

        for index, link_id in enumerate(links_order):
            link = Link.query.get(link_id)
            if link:
                link.order = index

        db.session.commit()

        security_logger.info(f"Links order updated by IP: {request.remote_addr}")
        return jsonify({"success": True, "message": "Порядок ссылок обновлен"})
    except Exception as e:
        db.session.rollback()
        security_logger.error(f"Error reordering links: {str(e)}")
        return (
            jsonify({"success": False, "message": "Ошибка при изменении порядка"}),
            500,
        )


@admin_bp.route("/admin/api/work-cards", methods=["GET"])
@require_login
def get_work_cards_admin():
    cards_list = WorkCard.query.order_by(WorkCard.order).all()
    return jsonify(
        {
            "success": True,
            "cards": [
                {
                    "id": card.id,
                    "title": card.title,
                    "icon": card.icon,
                    "text": card.text,
                    "link": card.link,
                    "order": card.order,
                }
                for card in cards_list
            ],
        }
    )


@admin_bp.route("/admin/api/work-cards", methods=["POST"])
@require_login
def create_work_card():
    try:
        data = request.json

        title = data.get("title", "").strip()
        icon = data.get("icon", "").strip()
        text = data.get("text", "").strip()
        link = data.get("link", "").strip()
        order = data.get("order", 0)

        if not title:
            return jsonify({"success": False, "message": "Заголовок обязателен"}), 400

        if not icon:
            return jsonify({"success": False, "message": "Иконка обязательна"}), 400

        if not text:
            return jsonify({"success": False, "message": "Текст обязателен"}), 400

        if not link:
            return jsonify({"success": False, "message": "Ссылка обязательна"}), 400

        card = WorkCard(title=title, icon=icon, text=text, link=link, order=order)
        db.session.add(card)
        db.session.commit()

        security_logger.info(f"Work card created by IP: {request.remote_addr}")
        return jsonify(
            {
                "success": True,
                "message": "Карточка работы успешно создана",
                "card": {
                    "id": card.id,
                    "title": card.title,
                    "icon": card.icon,
                    "text": card.text,
                    "link": card.link,
                    "order": card.order,
                },
            }
        )
    except Exception as e:
        db.session.rollback()
        security_logger.error(f"Error creating work card: {str(e)}")
        return jsonify({"success": False, "message": "Ошибка при создании карточки работы"}), 500


@admin_bp.route("/admin/api/work-cards/<int:card_id>", methods=["PUT"])
@require_login
def update_work_card(card_id):
    try:
        card = WorkCard.query.get_or_404(card_id)
        data = request.json

        title = data.get("title", card.title).strip()
        icon = data.get("icon", card.icon).strip()
        text = data.get("text", card.text).strip()
        link = data.get("link", card.link).strip()
        order = data.get("order", card.order)

        if not title:
            return jsonify({"success": False, "message": "Заголовок обязателен"}), 400

        if not icon:
            return jsonify({"success": False, "message": "Иконка обязательна"}), 400

        if not text:
            return jsonify({"success": False, "message": "Текст обязателен"}), 400

        if not link:
            return jsonify({"success": False, "message": "Ссылка обязательна"}), 400

        card.title = title
        card.icon = icon
        card.text = text
        card.link = link
        card.order = order
        db.session.commit()

        security_logger.info(f"Work card {card_id} updated by IP: {request.remote_addr}")
        return jsonify(
            {
                "success": True,
                "message": "Карточка работы успешно обновлена",
                "card": {
                    "id": card.id,
                    "title": card.title,
                    "icon": card.icon,
                    "text": card.text,
                    "link": card.link,
                    "order": card.order,
                },
            }
        )
    except Exception as e:
        db.session.rollback()
        security_logger.error(f"Error updating work card: {str(e)}")
        return (
            jsonify({"success": False, "message": "Ошибка при обновлении карточки работы"}),
            500,
        )


@admin_bp.route("/admin/api/work-cards/<int:card_id>", methods=["DELETE"])
@require_login
def delete_work_card(card_id):
    try:
        card = WorkCard.query.get_or_404(card_id)
        db.session.delete(card)
        db.session.commit()

        security_logger.info(f"Work card {card_id} deleted by IP: {request.remote_addr}")
        return jsonify({"success": True, "message": "Карточка работы успешно удалена"})
    except Exception as e:
        db.session.rollback()
        security_logger.error(f"Error deleting work card: {str(e)}")
        return jsonify({"success": False, "message": "Ошибка при удалении карточки работы"}), 500


@admin_bp.route("/admin/api/work-cards/reorder", methods=["PUT"])
@require_login
def reorder_work_cards():
    try:
        data = request.json
        cards_order = data.get("order", [])

        for index, card_id in enumerate(cards_order):
            card = WorkCard.query.get(card_id)
            if card:
                card.order = index

        db.session.commit()

        security_logger.info(f"Work cards order updated by IP: {request.remote_addr}")
        return jsonify({"success": True, "message": "Порядок карточек работы обновлен"})
    except Exception as e:
        db.session.rollback()
        security_logger.error(f"Error reordering work cards: {str(e)}")
        return (
            jsonify({"success": False, "message": "Ошибка при изменении порядка"}),
            500,
        )


@admin_bp.route("/admin/api/upload-work-icon", methods=["POST"])
@require_login
def upload_work_icon():
    try:
        if "file" not in request.files:
            return jsonify({"success": False, "message": "Файл не найден"}), 400

        file = request.files["file"]
        if file.filename == "":
            return jsonify({"success": False, "message": "Файл не выбран"}), 400

        allowed_extensions = {"png", "jpg", "jpeg", "gif", "svg", "webp", "ico"}
        filename = file.filename
        file_ext = filename.rsplit(".", 1)[1].lower() if "." in filename else ""

        if file_ext not in allowed_extensions:
            return (
                jsonify(
                    {
                        "success": False,
                        "message": f"Недопустимое расширение файла. Разрешены: {', '.join(allowed_extensions)}",
                    }
                ),
                400,
            )

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        safe_filename = secure_filename(filename)
        name_without_ext = safe_filename.rsplit(".", 1)[0] if "." in safe_filename else safe_filename
        unique_filename = f"work-icon_{name_without_ext}_{timestamp}.{file_ext}"

        upload_dir = _get_upload_dir("icons")

        file_path = os.path.join(upload_dir, unique_filename)
        file.save(file_path)

        icon_path = _build_upload_url("icons", unique_filename)

        security_logger.info(f"Work icon uploaded by IP: {request.remote_addr}, file: {unique_filename}")
        return jsonify(
            {
                "success": True,
                "message": "Иконка успешно загружена",
                "icon_path": icon_path,
            }
        )
    except Exception as e:
        security_logger.error(f"Error uploading work icon: {str(e)}")
        return jsonify({"success": False, "message": "Ошибка при загрузке иконки"}), 500


@admin_bp.route("/admin/api/calculator-settings", methods=["GET"])
@require_login
def get_calculator_settings():
    settings = CalculatorSettings.query.first()
    if not settings:
        return jsonify({"success": False, "message": "Настройки калькулятора не найдены"}), 404

    import json
    try:
        cities = json.loads(settings.cities)
    except:
        cities = []

    return jsonify(
        {
            "success": True,
            "settings": {
                "cities": cities,
                "warehouse_price_per_deposit": settings.warehouse_price_per_deposit,
                "warehouse_price_prikop": settings.warehouse_price_prikop,
                "warehouse_price_magnet": settings.warehouse_price_magnet,
                "weeks_per_month": settings.weeks_per_month,
                "packing_bonus": settings.packing_bonus,
                "chemist_kg_price": getattr(settings, "chemist_kg_price", None) or 120000.0,
                "carrier_with_weight_price_per_step": getattr(settings, "carrier_with_weight_price_per_step", None) or 100000.0,
                "carrier_without_weight_price_per_step": getattr(settings, "carrier_without_weight_price_per_step", None) or 2000.0,
            },
        }
    )


@admin_bp.route("/admin/api/calculator-settings", methods=["PUT"])
@require_login
def update_calculator_settings():
    try:
        data = request.json
        import json

        cities = data.get("cities", [])
        warehouse_price_per_deposit = data.get("warehouse_price_per_deposit", 4225.0)
        warehouse_price_prikop = data.get("warehouse_price_prikop", 4225.0)
        warehouse_price_magnet = data.get("warehouse_price_magnet", 4225.0)
        weeks_per_month = data.get("weeks_per_month", 4.33)
        packing_bonus = data.get("packing_bonus", 1100.0)
        chemist_kg_price = data.get("chemist_kg_price", 120000.0)
        carrier_with_weight_price_per_step = data.get("carrier_with_weight_price_per_step", 100000.0)
        carrier_without_weight_price_per_step = data.get("carrier_without_weight_price_per_step", 2000.0)

        if not isinstance(cities, list):
            return jsonify({"success": False, "message": "Города должны быть массивом"}), 400

        for city in cities:
            if not isinstance(city, dict) or "name" not in city or "products" not in city:
                return (
                    jsonify({"success": False, "message": "Каждый город должен иметь name и products"}),
                    400,
                )
            if not isinstance(city["products"], list):
                return jsonify({"success": False, "message": "Товары города должны быть массивом"}), 400
            for product in city["products"]:
                if not isinstance(product, dict) or "name" not in product or "price" not in product:
                    return (
                        jsonify({"success": False, "message": "Каждый товар в городе должен иметь name и price"}),
                        400,
                    )
                if not isinstance(product["price"], (int, float)) or product["price"] < 0:
                    return jsonify({"success": False, "message": "Цена товара в городе должна быть положительным числом"}), 400

        if not isinstance(warehouse_price_per_deposit, (int, float)) or warehouse_price_per_deposit < 0:
            return (
                jsonify({"success": False, "message": "Цена за клад должна быть положительным числом"}),
                400,
            )

        if not isinstance(warehouse_price_prikop, (int, float)) or warehouse_price_prikop < 0:
            return (
                jsonify({"success": False, "message": "Цена за клад 'прикоп' должна быть положительным числом"}),
                400,
            )

        if not isinstance(warehouse_price_magnet, (int, float)) or warehouse_price_magnet < 0:
            return (
                jsonify({"success": False, "message": "Цена за клад 'магнит' должна быть положительным числом"}),
                400,
            )

        if not isinstance(weeks_per_month, (int, float)) or weeks_per_month <= 0:
            return (
                jsonify({"success": False, "message": "Количество недель в месяце должно быть положительным числом"}),
                400,
            )

        if not isinstance(packing_bonus, (int, float)) or packing_bonus < 0:
            return (
                jsonify({"success": False, "message": "Бонус за фасовку должен быть неотрицательным числом"}),
                400,
            )

        if not isinstance(chemist_kg_price, (int, float)) or chemist_kg_price < 0:
            return jsonify({"success": False, "message": "Цена за 1 кг (химик) должна быть неотрицательным числом"}), 400
        if not isinstance(carrier_with_weight_price_per_step, (int, float)) or carrier_with_weight_price_per_step < 0:
            return jsonify({"success": False, "message": "Цена за шаг «с весом» должна быть неотрицательным числом"}), 400
        if not isinstance(carrier_without_weight_price_per_step, (int, float)) or carrier_without_weight_price_per_step < 0:
            return jsonify({"success": False, "message": "Цена за шаг «без веса» должна быть неотрицательным числом"}), 400

        settings = CalculatorSettings.query.first()
        if settings:
            settings.cities = json.dumps(cities, ensure_ascii=False)
            settings.warehouse_price_per_deposit = float(warehouse_price_per_deposit)
            settings.warehouse_price_prikop = float(warehouse_price_prikop)
            settings.warehouse_price_magnet = float(warehouse_price_magnet)
            settings.weeks_per_month = float(weeks_per_month)
            settings.packing_bonus = float(packing_bonus)
            settings.chemist_kg_price = float(chemist_kg_price)
            settings.carrier_with_weight_price_per_step = float(carrier_with_weight_price_per_step)
            settings.carrier_without_weight_price_per_step = float(carrier_without_weight_price_per_step)
        else:
            settings = CalculatorSettings(
                courier_products=json.dumps([], ensure_ascii=False),
                cities=json.dumps(cities, ensure_ascii=False),
                warehouse_price_per_deposit=float(warehouse_price_per_deposit),
                warehouse_price_prikop=float(warehouse_price_prikop),
                warehouse_price_magnet=float(warehouse_price_magnet),
                weeks_per_month=float(weeks_per_month),
                packing_bonus=float(packing_bonus),
                chemist_kg_price=float(chemist_kg_price),
                carrier_with_weight_price_per_step=float(carrier_with_weight_price_per_step),
                carrier_without_weight_price_per_step=float(carrier_without_weight_price_per_step),
            )
            db.session.add(settings)

        db.session.commit()

        security_logger.info(f"Calculator settings updated by IP: {request.remote_addr}")
        return jsonify(
            {
                "success": True,
                "message": "Настройки калькулятора успешно обновлены",
                "settings": {
                    "cities": cities,
                    "warehouse_price_per_deposit": settings.warehouse_price_per_deposit,
                    "warehouse_price_prikop": settings.warehouse_price_prikop,
                    "warehouse_price_magnet": settings.warehouse_price_magnet,
                    "weeks_per_month": settings.weeks_per_month,
                    "packing_bonus": settings.packing_bonus,
                    "chemist_kg_price": getattr(settings, "chemist_kg_price", None) or 120000.0,
                    "carrier_with_weight_price_per_step": getattr(settings, "carrier_with_weight_price_per_step", None) or 100000.0,
                    "carrier_without_weight_price_per_step": getattr(settings, "carrier_without_weight_price_per_step", None) or 2000.0,
                },
            }
        )
    except Exception as e:
        db.session.rollback()
        security_logger.error(f"Error updating calculator settings: {str(e)}")
        return (
            jsonify({"success": False, "message": "Ошибка при обновлении настроек калькулятора"}),
            500,
        )


@admin_bp.route("/admin/api/settings", methods=["GET"])
@require_login
def get_all_settings():
    try:
        chatbot_settings = ChatBotSettings.query.first()
        chatbot_data = {
            "openai_token": chatbot_settings.openai_token or "" if chatbot_settings else "",
            "preset": chatbot_settings.preset or "" if chatbot_settings else ""
        }
        
        return jsonify({
            "success": True,
            "chatbot": chatbot_data
        })
    except Exception as e:
        security_logger.error(f"Error getting settings: {str(e)}")
        return (
            jsonify({"success": False, "message": "Ошибка при получении настроек"}),
            500,
        )

@admin_bp.route("/admin/api/support-requests", methods=["GET"])
@require_login
def get_support_requests():
    requests_list = SupportRequest.query.order_by(
        SupportRequest.status.asc(),
        SupportRequest.created_at.desc()
    ).all()

    return jsonify({
        "success": True,
        "requests": [
            {
                "id": item.id,
                "message": item.message,
                "contact_method": item.contact_method,
                "status": item.status,
                "created_at": item.created_at.isoformat() if item.created_at else None,
            }
            for item in requests_list
        ],
    })

@admin_bp.route("/admin/api/support-requests/<int:request_id>", methods=["PUT"])
@require_login
def update_support_request(request_id):
    try:
        item = SupportRequest.query.get_or_404(request_id)
        data = request.json or {}
        status = (data.get("status") or "").strip().lower()
        if status not in {"new", "processed"}:
            return jsonify({"success": False, "message": "Некорректный статус"}), 400

        item.status = status
        db.session.commit()

        return jsonify({"success": True, "message": "Статус обращения обновлен"})
    except Exception as e:
        db.session.rollback()
        security_logger.error(f"Error updating support request: {str(e)}")
        return jsonify({"success": False, "message": "Ошибка при обновлении статуса обращения"}), 500

@admin_bp.route("/admin/api/support-requests/<int:request_id>", methods=["DELETE"])
@require_login
def delete_support_request(request_id):
    try:
        item = SupportRequest.query.get_or_404(request_id)
        db.session.delete(item)
        db.session.commit()
        return jsonify({"success": True, "message": "Обращение удалено"})
    except Exception as e:
        db.session.rollback()
        security_logger.error(f"Error deleting support request: {str(e)}")
        return jsonify({"success": False, "message": "Ошибка при удалении обращения"}), 500


@admin_bp.route("/admin/api/settings", methods=["PUT"])
@require_login
def update_settings():
    try:
        data = request.json
        
        if "chatbot" in data:
            chatbot_data = data["chatbot"]
            openai_token = chatbot_data.get("openai_token", "").strip() if chatbot_data.get("openai_token") else ""
            preset = chatbot_data.get("preset", "").strip() if chatbot_data.get("preset") else ""

            settings = ChatBotSettings.query.first()
            if settings:
                settings.openai_token = openai_token
                settings.preset = preset
            else:
                settings = ChatBotSettings(
                    openai_token=openai_token,
                    preset=preset
                )
                db.session.add(settings)

            db.session.commit()
            security_logger.info(f"Chatbot settings updated by IP: {request.remote_addr}")

        if "umami" in data:
            umami_data = data["umami"]
            api_key = (umami_data.get("api_key") or "").strip()
            website_id = (umami_data.get("website_id") or "").strip() or "6ea99ce5-33ba-4d44-809a-76f429b7e221"
            settings = UmamiSettings.query.first()
            if settings:
                if api_key:
                    settings.api_key = api_key
                settings.website_id = website_id
            else:
                settings = UmamiSettings(api_key=api_key, website_id=website_id)
                db.session.add(settings)
            db.session.commit()
            security_logger.info(f"Umami settings updated by IP: {request.remote_addr}")

        return jsonify({
            "success": True,
            "message": "Настройки успешно обновлены"
        })
    except Exception as e:
        db.session.rollback()
        security_logger.error(f"Error updating settings: {str(e)}")
        return (
            jsonify({"success": False, "message": f"Ошибка при обновлении настроек: {str(e)}"}),
            500,
        )


@admin_bp.route("/admin/api/umami/stats", methods=["GET"])
@require_login
def umami_proxy_stats():
    try:
        settings = UmamiSettings.query.first()
        if not settings or not settings.api_key:
            return jsonify({"success": False, "error": "Umami API key not configured"}), 400
        website_id = settings.website_id or "6ea99ce5-33ba-4d44-809a-76f429b7e221"
        start_at = request.args.get("startAt", type=int)
        end_at = request.args.get("endAt", type=int)
        if not start_at or not end_at:
            return jsonify({"success": False, "error": "startAt and endAt required"}), 400
        url = f"{UMAMI_API_BASE}/websites/{website_id}/stats"
        headers = {"Accept": "application/json", "x-umami-api-key": settings.api_key}
        r = requests.get(url, headers=headers, params={"startAt": start_at, "endAt": end_at}, timeout=15)
        r.raise_for_status()
        return jsonify(r.json())
    except requests.RequestException as e:
        security_logger.warning(f"Umami stats request failed: {e}")
        return jsonify({"success": False, "error": str(e)}), 502
    except Exception as e:
        security_logger.error(f"Umami stats error: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


@admin_bp.route("/admin/api/umami/metrics", methods=["GET"])
@require_login
def umami_proxy_metrics():
    try:
        settings = UmamiSettings.query.first()
        if not settings or not settings.api_key:
            return jsonify({"success": False, "error": "Umami API key not configured"}), 400
        website_id = settings.website_id or "6ea99ce5-33ba-4d44-809a-76f429b7e221"
        start_at = request.args.get("startAt", type=int)
        end_at = request.args.get("endAt", type=int)
        metric_type = request.args.get("type", "country")
        if not start_at or not end_at:
            return jsonify({"success": False, "error": "startAt and endAt required"}), 400
        url = f"{UMAMI_API_BASE}/websites/{website_id}/metrics"
        headers = {"Accept": "application/json", "x-umami-api-key": settings.api_key}
        params = {"startAt": start_at, "endAt": end_at, "type": metric_type}
        r = requests.get(url, headers=headers, params=params, timeout=15)
        r.raise_for_status()
        return jsonify(r.json())
    except requests.RequestException as e:
        security_logger.warning(f"Umami metrics request failed: {e}")
        return jsonify({"success": False, "error": str(e)}), 502
    except Exception as e:
        security_logger.error(f"Umami metrics error: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


@admin_bp.route("/admin/api/pages/<page_type>", methods=["GET", "PUT"])
@require_login
def manage_page_content(page_type):
    import json
    if request.method == "GET":
        page = PageContent.query.filter_by(page_type=page_type).first()
        if not page:
            return jsonify(
                {
                    "success": True,
                    "top_text": "",
                    "bottom_text": "",
                    "products": [],
                }
            )

        try:
            raw_products = json.loads(page.products) if page.products else []
        except Exception:
            raw_products = []

        normalized_products = []
        for idx, item in enumerate(raw_products):
            if not isinstance(item, dict):
                continue
            name = item.get("name", "")
            description = item.get("description", "")
            image_path = item.get("image_path", "")
            prices = item.get("prices")
            if not isinstance(prices, list):
                single_price = item.get("price")
                if single_price is not None and single_price != "":
                    prices = [{"weight": "", "price": str(single_price)}]
                else:
                    prices = []

            normalized_products.append(
                {
                    "id": item.get("id", idx + 1),
                    "name": name,
                    "description": description,
                    "image_path": image_path,
                    "prices": prices,
                }
            )

        return jsonify(
            {
                "success": True,
                "top_text": page.top_text or "",
                "bottom_text": page.bottom_text or "",
                "products": normalized_products,
            }
        )
    
    elif request.method == "PUT":
        data = request.get_json()
        page = PageContent.query.filter_by(page_type=page_type).first()
        
        if not page:
            page = PageContent(page_type=page_type)
            db.session.add(page)
        
        page.top_text = data.get("top_text", "")
        page.bottom_text = data.get("bottom_text", "")
        page.products = json.dumps(data.get("products", []))
        
        db.session.commit()
        return jsonify({"success": True, "message": "Страница успешно обновлена"})


@admin_bp.route("/admin/api/pages/<page_type>/products", methods=["POST"])
@require_login
def add_page_product(page_type):
    import json
    data = request.get_json()
    page = PageContent.query.filter_by(page_type=page_type).first()
    
    if not page:
        page = PageContent(page_type=page_type, products="[]")
        db.session.add(page)
    
    try:
        products = json.loads(page.products) if page.products else []
    except:
        products = []
    
    new_product = {
        "name": data.get("name", ""),
        "description": data.get("description", "")
    }
    products.append(new_product)
    page.products = json.dumps(products)
    
    db.session.commit()
    return jsonify({"success": True, "message": "Товар добавлен"})


@admin_bp.route("/admin/api/pages/<page_type>/products/<int:product_id>", methods=["PUT", "DELETE"])
@require_login
def manage_page_product(page_type, product_id):
    import json
    page = PageContent.query.filter_by(page_type=page_type).first()
    
    if not page:
        return jsonify({"success": False, "message": "Страница не найдена"}), 404
    
    try:
        products = json.loads(page.products) if page.products else []
    except:
        products = []
    
    if product_id >= len(products):
        return jsonify({"success": False, "message": "Товар не найден"}), 404
    
    if request.method == "PUT":
        data = request.get_json()
        products[product_id] = {
            "name": data.get("name", ""),
            "description": data.get("description", "")
        }
        page.products = json.dumps(products)
        db.session.commit()
        return jsonify({"success": True, "message": "Товар обновлен"})
    
    elif request.method == "DELETE":
        products.pop(product_id)
        page.products = json.dumps(products)
        db.session.commit()
        return jsonify({"success": True, "message": "Товар удален"})


@admin_bp.route("/admin/api/promotions", methods=["GET", "PUT"])
@require_login
def manage_promotions():
    import json
    if request.method == "GET":
        page = PromotionsPage.query.first()
        if not page:
            return jsonify(
                {
                    "success": True,
                    "text": "",
                    "image_path": "",
                    "products": [],
                }
            )

        try:
            raw_products = json.loads(page.products) if page.products else []
        except Exception:
            raw_products = []

        normalized_products = []
        for idx, item in enumerate(raw_products):
            if not isinstance(item, dict):
                continue
            name = item.get("name", "")
            description = item.get("description", "")
            image_path = item.get("image_path", "")
            prices = item.get("prices")
            if not isinstance(prices, list):
                single_price = item.get("price")
                if single_price is not None and single_price != "":
                    prices = [{"weight": "", "price": str(single_price)}]
                else:
                    prices = []

            normalized_products.append(
                {
                    "id": item.get("id", idx + 1),
                    "name": name,
                    "description": description,
                    "image_path": image_path,
                    "prices": prices,
                }
            )

        return jsonify(
            {
                "success": True,
                "text": page.text or "",
                "image_path": page.image_path or "",
                "products": normalized_products,
            }
        )
    
    elif request.method == "PUT":
        data = request.get_json()
        page = PromotionsPage.query.first()
        
        if not page:
            page = PromotionsPage()
            db.session.add(page)
        
        page.text = data.get("text", "")
        if "image_path" in data:
            page.image_path = data.get("image_path", "")
        if "products" in data:
            page.products = json.dumps(data.get("products", []))
        
        db.session.commit()
        return jsonify({"success": True, "message": "Страница акций успешно обновлена"})


@admin_bp.route("/admin/api/promotions/products", methods=["POST"])
@require_login
def add_promotion_product():
    import json
    data = request.get_json()
    page = PromotionsPage.query.first()
    
    if not page:
        page = PromotionsPage(products="[]")
        db.session.add(page)
    
    try:
        products = json.loads(page.products) if page.products else []
    except:
        products = []
    
    new_product = {
        "name": data.get("name", ""),
        "description": data.get("description", ""),
        "price": data.get("price", "")
    }
    products.append(new_product)
    page.products = json.dumps(products)
    
    db.session.commit()
    return jsonify({"success": True, "message": "Товар добавлен в прайс"})


@admin_bp.route("/admin/api/promotions/products/<int:product_id>", methods=["PUT", "DELETE"])
@require_login
def manage_promotion_product(product_id):
    import json
    page = PromotionsPage.query.first()
    
    if not page:
        return jsonify({"success": False, "message": "Страница не найдена"}), 404
    
    try:
        products = json.loads(page.products) if page.products else []
    except:
        products = []
    
    if product_id >= len(products):
        return jsonify({"success": False, "message": "Товар не найден"}), 404
    
    if request.method == "PUT":
        data = request.get_json()
        products[product_id] = {
            "name": data.get("name", ""),
            "description": data.get("description", ""),
            "price": data.get("price", "")
        }
        page.products = json.dumps(products)
        db.session.commit()
        return jsonify({"success": True, "message": "Товар обновлен"})
    
    elif request.method == "DELETE":
        products.pop(product_id)
        page.products = json.dumps(products)
        db.session.commit()
        return jsonify({"success": True, "message": "Товар удален из прайса"})


@admin_bp.route("/admin/api/upload-promotions-image", methods=["POST"])
@require_login
def upload_promotions_image():
    try:
        if "file" not in request.files:
            return jsonify({"success": False, "message": "Файл не найден"}), 400

        file = request.files["file"]
        if file.filename == "":
            return jsonify({"success": False, "message": "Файл не выбран"}), 400

        allowed_extensions = {"png", "jpg", "jpeg", "gif", "svg", "webp"}
        filename = file.filename
        file_ext = filename.rsplit(".", 1)[1].lower() if "." in filename else ""

        if file_ext not in allowed_extensions:
            return (
                jsonify(
                    {
                        "success": False,
                        "message": f"Недопустимое расширение файла. Разрешены: {', '.join(allowed_extensions)}",
                    }
                ),
                400,
            )

        if file.content_length and file.content_length > 15 * 1024 * 1024:
            return jsonify({"success": False, "message": "Размер файла не должен превышать 15 МБ"}), 400

        secure_name = secure_filename(filename)
        upload_dir = _get_upload_dir("promotions")
        file_path = os.path.join(upload_dir, secure_name)
        file.save(file_path)
        image_url = _build_upload_url("promotions", secure_name)

        return jsonify({"success": True, "image_path": image_url})
    except Exception as e:
        security_logger.error(f"Error uploading promotions image: {str(e)}")
        return jsonify({"success": False, "message": f"Ошибка при загрузке изображения: {str(e)}"}), 500


@admin_bp.route("/admin/api/upload-product-image", methods=["POST"])
@require_login
def upload_product_image():
    """
    Загрузка изображений для товаров (страницы Отправки, Опт, Акции).
    Файлы сохраняются в data/uploads/products и доступны по /uploads/products/...
    """
    try:
        if "file" not in request.files:
            return jsonify({"success": False, "message": "Файл не найден"}), 400

        file = request.files["file"]
        if file.filename == "":
            return jsonify({"success": False, "message": "Файл не выбран"}), 400

        allowed_extensions = {"png", "jpg", "jpeg", "gif", "webp"}
        filename = file.filename
        file_ext = filename.rsplit(".", 1)[1].lower() if "." in filename else ""

        if file_ext not in allowed_extensions:
            return (
                jsonify(
                    {
                        "success": False,
                        "message": f"Недопустимое расширение файла. Разрешены: {', '.join(allowed_extensions)}",
                    }
                ),
                400,
            )

        if file.content_length and file.content_length > 15 * 1024 * 1024:
            return jsonify({"success": False, "message": "Размер файла не должен превышать 15 МБ"}), 400

        safe_name = secure_filename(filename)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        name_without_ext = safe_name.rsplit(".", 1)[0] if "." in safe_name else safe_name
        unique_name = f"product_{name_without_ext}_{timestamp}.{file_ext}"

        upload_dir = _get_upload_dir("products")
        file_path = os.path.join(upload_dir, unique_name)
        file.save(file_path)

        image_url = _build_upload_url("products", unique_name)
        security_logger.info(f"Product image uploaded by IP: {request.remote_addr}, file: {unique_name}")

        return jsonify({"success": True, "image_path": image_url})
    except Exception as e:
        security_logger.error(f"Error uploading product image: {str(e)}")
        return jsonify({"success": False, "message": f"Ошибка при загрузке изображения товара: {str(e)}"}), 500

