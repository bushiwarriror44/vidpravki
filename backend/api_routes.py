from flask import Blueprint, jsonify
from flask_wtf.csrf import generate_csrf
from models import (
    Link,
    SiteIcon,
    WorkCard,
    CalculatorSettings,
    IntroButtonLink,
    ContactUsButtonLink,
    IntroBackground,
    ChatBotSettings,
    SupportRequest,
    PageContent,
    PromotionsPage,
)

api_bp = Blueprint('api', __name__, url_prefix='/api')

@api_bp.route('/csrf-token')
def get_csrf_token():
    token = generate_csrf()
    return jsonify({'csrf_token': token})

@api_bp.route('/get_site_icon')
def get_site_icon():
    site_icon = SiteIcon.query.first()
    return jsonify({
        'icon_path': site_icon.icon_path if site_icon else None
    })

@api_bp.route('/get_links')
def get_links():
    links_list = Link.query.order_by(Link.order).all()

    links_data = [
        {
            'id': link.id,
            'text': link.text,
            'url': link.url,
            'icon': link.icon,
            'order': link.order
        } for link in links_list
    ]

    return jsonify({'links': links_data})

@api_bp.route('/get_calculator_settings')
def get_calculator_settings():
    settings = CalculatorSettings.query.first()
    if not settings:
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
        return jsonify({
            'cities': default_cities,
            'warehouse_price_per_deposit': default_price,
            'warehouse_price_prikop': default_price,
            'warehouse_price_magnet': default_price,
            'weeks_per_month': 4.33,
            'packing_bonus': 1100.0,
            'chemist_kg_price': 120000.0,
            'carrier_with_weight_price_per_step': 100000.0,
            'carrier_without_weight_price_per_step': 2000.0,
        })

    import json
    try:
        cities = json.loads(settings.cities)
    except:
        cities = []

    return jsonify({
        'cities': cities,
        'warehouse_price_per_deposit': settings.warehouse_price_per_deposit,
        'warehouse_price_prikop': settings.warehouse_price_prikop,
        'warehouse_price_magnet': settings.warehouse_price_magnet,
        'weeks_per_month': settings.weeks_per_month,
        'packing_bonus': settings.packing_bonus,
        'chemist_kg_price': getattr(settings, 'chemist_kg_price', None) or 120000.0,
        'carrier_with_weight_price_per_step': getattr(settings, 'carrier_with_weight_price_per_step', None) or 100000.0,
        'carrier_without_weight_price_per_step': getattr(settings, 'carrier_without_weight_price_per_step', None) or 2000.0,
    })

@api_bp.route('/get_work_cards')
def get_work_cards():
    cards_list = WorkCard.query.order_by(WorkCard.order).all()

    cards_data = [
        {
            'id': card.id,
            'title': card.title,
            'icon': card.icon,
            'text': card.text,
            'link': card.link,
            'order': card.order
        } for card in cards_list
    ]

    return jsonify({'cards': cards_data})

@api_bp.route('/get_intro_button_link')
def get_intro_button_link():
    intro_link = IntroButtonLink.query.first()
    if intro_link:
        return jsonify({'link': intro_link.link})
    return jsonify({'link': '#about'})

@api_bp.route('/get_intro_background')
def get_intro_background():
    intro_bg = IntroBackground.query.first()
    if intro_bg:
        return jsonify({
            'background_path': intro_bg.background_path,
            'background_type': intro_bg.background_type
        })
    return jsonify({
        'background_path': '/assets/img/main/intro-bg.png',
        'background_type': 'image'
    })

@api_bp.route('/get_contact_us_button_link')
def get_contact_us_button_link():
    contact_link = ContactUsButtonLink.query.first()
    if contact_link:
        return jsonify({'link': contact_link.link})
    return jsonify({'link': '#'})

@api_bp.route('/chatbot/message', methods=['POST'])
def chatbot_message():
    try:
        from flask import request
        import openai
        
        data = request.get_json()
        user_message = data.get('message', '').strip()
        
        if not user_message:
            return jsonify({'success': False, 'error': 'Сообщение не может быть пустым'}), 400
        
        settings = ChatBotSettings.query.first()
        if not settings or not settings.openai_token:
            return jsonify({'success': False, 'error': 'Токен OpenAI не настроен'}), 500
        
        client = openai.OpenAI(api_key=settings.openai_token)
        
        messages = []
        
        if settings.preset:
            messages.append({
                'role': 'system',
                'content': settings.preset
            })
        
        messages.append({
            'role': 'user',
            'content': user_message
        })
        
        try:
            response = client.chat.completions.create(
                model='gpt-4o-mini',
                messages=messages,
                temperature=0.7,
                max_tokens=1000
            )
            
            bot_response = response.choices[0].message.content
            
            return jsonify({
                'success': True,
                'response': bot_response
            })
        except openai.AuthenticationError:
            return jsonify({
                'success': False,
                'error': 'Неверный токен OpenAI API'
            }), 401
        except openai.RateLimitError:
            return jsonify({
                'success': False,
                'error': 'Превышен лимит запросов к OpenAI API'
            }), 429
        except openai.OpenAIError as e:
            return jsonify({
                'success': False,
                'error': f'Ошибка OpenAI API: {str(e)}'
            }), 500
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Ошибка при обработке запроса: {str(e)}'
        }), 500

@api_bp.route('/support-requests', methods=['POST'])
def create_support_request():
    try:
        from flask import request

        data = request.get_json() or {}
        message = (data.get('message') or '').strip()
        contact_method = (data.get('contact_method') or '').strip()

        if not message:
            return jsonify({'success': False, 'message': 'Введите сообщение'}), 400
        if not contact_method:
            return jsonify({'success': False, 'message': 'Укажите желаемый способ связи'}), 400

        if len(message) > 2000:
            return jsonify({'success': False, 'message': 'Сообщение слишком длинное (макс. 2000 символов)'}), 400
        if len(contact_method) > 300:
            return jsonify({'success': False, 'message': 'Способ связи слишком длинный (макс. 300 символов)'}), 400

        support_request = SupportRequest(
            message=message,
            contact_method=contact_method,
            status='new',
        )
        from models import db
        db.session.add(support_request)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Заявка успешно отправлена. Мы свяжемся с вами в ближайшее время.',
            'id': support_request.id,
        })
    except Exception as e:
        from models import db
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Ошибка при отправке заявки: {str(e)}'}), 500

@api_bp.route('/pages/<page_type>')
def get_page_content(page_type):
    import json
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
        # Обратная совместимость для старого формата с одиночным полем price
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

@api_bp.route('/promotions')
def get_promotions():
    import json
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
