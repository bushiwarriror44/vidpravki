from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()


class SiteIcon(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    icon_path = db.Column(db.String(500), nullable=False)


class IntroButtonLink(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    link = db.Column(db.String(500), nullable=False)


class ContactUsButtonLink(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    link = db.Column(db.String(500), nullable=False)


class IntroBackground(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    background_path = db.Column(db.String(500), nullable=False)
    background_type = db.Column(db.String(20), nullable=False)


class Link(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    text = db.Column(db.String(200), nullable=False)
    url = db.Column(db.String(500), nullable=False)
    icon = db.Column(db.String(500), nullable=False)
    order = db.Column(db.Integer, nullable=False, default=0)


class WorkCard(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    icon = db.Column(db.String(500), nullable=False)
    text = db.Column(db.Text, nullable=False)
    link = db.Column(db.String(500), nullable=False)
    order = db.Column(db.Integer, nullable=False, default=0)


class CalculatorSettings(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    courier_products = db.Column(db.Text, nullable=False)
    cities = db.Column(db.Text, nullable=False)
    warehouse_price_per_deposit = db.Column(db.Float, nullable=False)
    warehouse_price_prikop = db.Column(db.Float, nullable=False)
    warehouse_price_magnet = db.Column(db.Float, nullable=False)
    weeks_per_month = db.Column(db.Float, nullable=False, default=4.33)
    packing_bonus = db.Column(db.Float, nullable=False, default=1100.0)
    chemist_kg_price = db.Column(db.Float, nullable=True)
    carrier_with_weight_price_per_step = db.Column(db.Float, nullable=True)
    carrier_without_weight_price_per_step = db.Column(db.Float, nullable=True)


class ChatBotSettings(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    openai_token = db.Column(db.String(500), nullable=True)
    preset = db.Column(db.Text, nullable=True)


class UmamiSettings(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    api_key = db.Column(db.String(500), nullable=True)
    website_id = db.Column(db.String(100), nullable=True)

class SupportRequest(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    message = db.Column(db.Text, nullable=False)
    contact_method = db.Column(db.String(300), nullable=False)
    status = db.Column(db.String(20), nullable=False, default="new")
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)


class PageContent(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    page_type = db.Column(db.String(50), nullable=False, unique=True)  # 'shipments' or 'wholesale'
    top_text = db.Column(db.Text, nullable=True)
    bottom_text = db.Column(db.Text, nullable=True)
    products = db.Column(db.Text, nullable=True)  # JSON array of products


class PromotionsPage(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    text = db.Column(db.Text, nullable=True)
    image_path = db.Column(db.String(500), nullable=True)
    products = db.Column(db.Text, nullable=True)  # JSON array of products from price list


def init_work_cards():
    if WorkCard.query.count() == 0:
        default_cards = [
            WorkCard(
                title="Курьер",
                icon="/assets/img/icons/courier-ico.svg",
                text="Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took.",
                link=".",
                order=0
            ),
            WorkCard(
                title="Xимик",
                icon="/assets/img/icons/chemie-ico.svg",
                text="Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took.",
                link=".",
                order=1
            ),
            WorkCard(
                title="Склад",
                icon="/assets/img/icons/sklad-ico.svg",
                text="Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took.",
                link=".",
                order=2
            )
        ]
        for card in default_cards:
            db.session.add(card)
        db.session.commit()


def init_intro_button_link():
    if IntroButtonLink.query.count() == 0:
        default_link = IntroButtonLink(link="#about")
        db.session.add(default_link)
        db.session.commit()


def init_contact_us_button_link():
    if ContactUsButtonLink.query.count() == 0:
        default_link = ContactUsButtonLink(link="#")
        db.session.add(default_link)
        db.session.commit()


def init_intro_background():
    if IntroBackground.query.count() == 0:
        default_background = IntroBackground(
            background_path="/assets/img/main/intro-bg.png",
            background_type="image"
        )
        db.session.add(default_background)
        db.session.commit()


def init_calculator_settings():
    from sqlalchemy import text
    for col, default in [
        ("chemist_kg_price", 120000.0),
        ("carrier_with_weight_price_per_step", 100000.0),
        ("carrier_without_weight_price_per_step", 2000.0),
    ]:
        try:
            db.session.execute(text(f"ALTER TABLE calculator_settings ADD COLUMN {col} REAL DEFAULT {default}"))
            db.session.commit()
        except Exception:
            db.session.rollback()
    if CalculatorSettings.query.count() == 0:
        import json
        default_cities = [
            {
                "name": "Москва",
                "products": [
                    {"name": "Яблоки", "price": 900},
                    {"name": "Груши", "price": 900},
                    {"name": "Апельсины", "price": 900}
                ]
            }
        ]
        default_price = 4225.0
        default_settings = CalculatorSettings(
            courier_products=json.dumps([], ensure_ascii=False),
            cities=json.dumps(default_cities, ensure_ascii=False),
            warehouse_price_per_deposit=default_price,
            warehouse_price_prikop=default_price,
            warehouse_price_magnet=default_price,
            weeks_per_month=4.33,
            packing_bonus=1100.0,
            chemist_kg_price=120000.0,
            carrier_with_weight_price_per_step=100000.0,
            carrier_without_weight_price_per_step=2000.0,
        )
        db.session.add(default_settings)
        db.session.commit()


def init_links():
    if Link.query.count() == 0:
        default_links = [
            Link(
                text="Rutor",
                url="https://example.com",
                icon="/assets/img/icons/rutor-ico.svg",
                order=0
            ),
            Link(
                text="Telegram",
                url="https://example.com",
                icon="/assets/img/icons/telegram-ico.svg",
                order=1
            ),
            Link(
                text="Магазин",
                url="https://example.com",
                icon="/assets/img/icons/shop-ico.svg",
                order=2
            )
        ]
        for link in default_links:
            db.session.add(link)
        db.session.commit()


def init_chatbot_settings():
    if ChatBotSettings.query.count() == 0:
        default_settings = ChatBotSettings(
            openai_token="",
            preset=""
        )
        db.session.add(default_settings)
        db.session.commit()


def init_umami_settings():
    try:
        if UmamiSettings.query.count() == 0:
            default_settings = UmamiSettings(
                api_key="",
                website_id="6ea99ce5-33ba-4d44-809a-76f429b7e221"
            )
            db.session.add(default_settings)
            db.session.commit()
    except Exception as e:
        import logging
        logging.getLogger(__name__).warning("init_umami_settings skipped: %s", e)
        db.session.rollback()


def init_page_content():
    import json
    shipments_bottom_default = """
<h2>Условия отправки почтой</h2>
<p>Отправка товара производится в течение 48 часов после оплаты!</p>
<p>При каждом заказе берём дополнительно 400 грн за упаковку и отправку.</p>
<p>Минимальный заказ — 20$.</p>
<h3>Методы оплаты</h3>
<p>Оплата картой (10% комиссия)</p>
<p>USDT, TRON, BTC, LTC — без комиссии.</p>
""".strip()

    shipments_page_qs = PageContent.query.filter_by(page_type="shipments")
    if shipments_page_qs.count() == 0:
        shipments_products = [
            {
                "id": 1,
                "name": "Яблоки (розница)",
                "description": "Сочные красные яблоки премиального сорта. Идеальны для свежего употребления.",
                "image_path": "/assets/img/main/1.png",
                "prices": [
                    {"weight": "0.5 кг", "price": "250 ₽"},
                    {"weight": "1 кг", "price": "450 ₽"},
                ],
            },
            {
                "id": 2,
                "name": "Апельсины (розница)",
                "description": "Спелые апельсины с ярким цитрусовым вкусом и высоким содержанием витамина C.",
                "image_path": "/assets/img/main/2.png",
                "prices": [
                    {"weight": "0.5 кг", "price": "270 ₽"},
                    {"weight": "1 кг", "price": "490 ₽"},
                ],
            },
            {
                "id": 3,
                "name": "Лимоны (розница)",
                "description": "Ароматные лимоны для чая, выпечки и домашних лимонадов.",
                "image_path": "/assets/img/main/3.png",
                "prices": [
                    {"weight": "0.5 кг", "price": "220 ₽"},
                    {"weight": "1 кг", "price": "400 ₽"},
                ],
            },
        ]

        shipments_page = PageContent(
            page_type="shipments",
            top_text="Это тестовый текст для страницы «Отправки». Вы можете изменить его в админке.",
            bottom_text=shipments_bottom_default,
            products=json.dumps(shipments_products, ensure_ascii=False),
        )
        db.session.add(shipments_page)
        db.session.commit()
    else:
        page = shipments_page_qs.first()
        if page is not None:
            changed = False
            if not page.top_text:
                page.top_text = "Это тестовый текст для страницы «Отправки». Вы можете изменить его в админке."
                changed = True
            if not page.bottom_text:
                page.bottom_text = shipments_bottom_default
                changed = True
            # если товаров нет или список пустой — подставляем тестовые
            try:
                current_products = json.loads(page.products) if page.products else []
            except Exception:
                current_products = []
            if not current_products:
                page.products = json.dumps(
                    [
                        {
                            "id": 1,
                            "name": "Яблоки (розница)",
                            "description": "Сочные красные яблоки премиального сорта. Идеальны для свежего употребления.",
                            "image_path": "/assets/img/main/1.png",
                            "prices": [
                                {"weight": "0.5 кг", "price": "250 ₽"},
                                {"weight": "1 кг", "price": "450 ₽"},
                            ],
                        },
                        {
                            "id": 2,
                            "name": "Апельсины (розница)",
                            "description": "Спелые апельсины с ярким цитрусовым вкусом и высоким содержанием витамина C.",
                            "image_path": "/assets/img/main/2.png",
                            "prices": [
                                {"weight": "0.5 кг", "price": "270 ₽"},
                                {"weight": "1 кг", "price": "490 ₽"},
                            ],
                        },
                        {
                            "id": 3,
                            "name": "Лимоны (розница)",
                            "description": "Ароматные лимоны для чая, выпечки и домашних лимонадов.",
                            "image_path": "/assets/img/main/3.png",
                            "prices": [
                                {"weight": "0.5 кг", "price": "220 ₽"},
                                {"weight": "1 кг", "price": "400 ₽"},
                            ],
                        },
                    ],
                    ensure_ascii=False,
                )
                changed = True

            if changed:
                db.session.commit()

    wholesale_page_qs = PageContent.query.filter_by(page_type="wholesale")
    if wholesale_page_qs.count() == 0:
        wholesale_products = [
            {
                "id": 1,
                "name": "Яблоки (опт)",
                "description": "Крупная оптовая партия яблок для магазинов и HoReCa.",
                "image_path": "/assets/img/main/1.png",
                "prices": [
                    {"weight": "5 кг", "price": "1 800 ₽"},
                    {"weight": "10 кг", "price": "3 400 ₽"},
                ],
            },
            {
                "id": 2,
                "name": "Апельсины (опт)",
                "description": "Свежие апельсины в оптовой фасовке для торговых сетей.",
                "image_path": "/assets/img/main/2.png",
                "prices": [
                    {"weight": "5 кг", "price": "1 950 ₽"},
                    {"weight": "10 кг", "price": "3 700 ₽"},
                ],
            },
            {
                "id": 3,
                "name": "Лимоны (опт)",
                "description": "Отборные лимоны крупным оптом.",
                "image_path": "/assets/img/main/3.png",
                "prices": [
                    {"weight": "5 кг", "price": "1 600 ₽"},
                    {"weight": "10 кг", "price": "3 000 ₽"},
                ],
            },
        ]

        wholesale_page = PageContent(
            page_type="wholesale",
            top_text="Тестовый верхний текст для страницы «Опт кладами». Измените его в админке.",
            bottom_text="Тестовый нижний текст для «Опта кладами». Также редактируется в админке.",
            products=json.dumps(wholesale_products, ensure_ascii=False),
        )
        db.session.add(wholesale_page)
        db.session.commit()
    else:
        page = wholesale_page_qs.first()
        if page is not None:
            changed = False
            try:
                current_products = json.loads(page.products) if page.products else []
            except Exception:
                current_products = []
            if not current_products:
                page.products = json.dumps(
                    [
                        {
                            "id": 1,
                            "name": "Яблоки (опт)",
                            "description": "Крупная оптовая партия яблок для магазинов и HoReCa.",
                            "image_path": "/assets/img/main/1.png",
                            "prices": [
                                {"weight": "5 кг", "price": "1 800 ₽"},
                                {"weight": "10 кг", "price": "3 400 ₽"},
                            ],
                        },
                        {
                            "id": 2,
                            "name": "Апельсины (опт)",
                            "description": "Свежие апельсины в оптовой фасовке для торговых сетей.",
                            "image_path": "/assets/img/main/2.png",
                            "prices": [
                                {"weight": "5 кг", "price": "1 950 ₽"},
                                {"weight": "10 кг", "price": "3 700 ₽"},
                            ],
                        },
                        {
                            "id": 3,
                            "name": "Лимоны (опт)",
                            "description": "Отборные лимоны крупным оптом.",
                            "image_path": "/assets/img/main/3.png",
                            "prices": [
                                {"weight": "5 кг", "price": "1 600 ₽"},
                                {"weight": "10 кг", "price": "3 000 ₽"},
                            ],
                        },
                    ],
                    ensure_ascii=False,
                )
                changed = True

            if changed:
                db.session.commit()


def init_promotions_page():
    import json
    base_products = [
        {
            "id": 1,
            "name": "Яблоки (акция)",
            "description": "Специальная цена на сладкие яблоки при заказе от 1 кг.",
            "image_path": "/assets/img/main/1.png",
            "prices": [
                {"weight": "1 кг", "price": "420 ₽"},
                {"weight": "2 кг", "price": "780 ₽"},
            ],
        },
        {
            "id": 2,
            "name": "Апельсины (акция)",
            "description": "Выгодное предложение на апельсины для свежевыжатого сока.",
            "image_path": "/assets/img/main/2.png",
            "prices": [
                {"weight": "1 кг", "price": "460 ₽"},
                {"weight": "3 кг", "price": "1 280 ₽"},
            ],
        },
        {
            "id": 3,
            "name": "Лимоны (акция)",
            "description": "Скидка на лимоны при заказе от 2 кг.",
            "image_path": "/assets/img/main/3.png",
            "prices": [
                {"weight": "2 кг", "price": "720 ₽"},
            ],
        },
    ]

    if PromotionsPage.query.count() == 0:
        promotions_products = [
            {
                "id": 1,
                "name": base_products[0]["name"],
                "description": base_products[0]["description"],
                "image_path": base_products[0]["image_path"],
                "prices": [
                    {"weight": "1 кг", "price": "420 ₽"},
                    {"weight": "2 кг", "price": "780 ₽"},
                ],
            },
            {
                "id": 2,
                "name": base_products[1]["name"],
                "description": base_products[1]["description"],
                "image_path": base_products[1]["image_path"],
                "prices": [
                    {"weight": "1 кг", "price": "460 ₽"},
                    {"weight": "3 кг", "price": "1 280 ₽"},
                ],
            },
            {
                "id": 3,
                "name": base_products[2]["name"],
                "description": base_products[2]["description"],
                "image_path": base_products[2]["image_path"],
                "prices": [
                    {"weight": "2 кг", "price": "720 ₽"},
                ],
            },
        ]

        promotions_page = PromotionsPage(
            text="Тестовый текст для страницы «Акции и предложения». Отредактируйте его под свои задачи.",
            image_path="",
            products=json.dumps(promotions_products, ensure_ascii=False),
        )
        db.session.add(promotions_page)
        db.session.commit()
    else:
        page = PromotionsPage.query.first()
        if page is not None:
            changed = False
            try:
                current_products = json.loads(page.products) if page.products else []
            except Exception:
                current_products = []
            if not current_products:
                page.products = json.dumps(base_products, ensure_ascii=False)
                changed = True

            if changed:
                db.session.commit()


def init_all_models():
    db.create_all()
    init_intro_button_link()
    init_contact_us_button_link()
    init_intro_background()
    init_work_cards()
    init_calculator_settings()
    init_links()
    init_chatbot_settings()
    init_umami_settings()
    init_page_content()
    init_promotions_page()