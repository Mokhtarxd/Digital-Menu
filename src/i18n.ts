import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

export const SUPPORTED_LANGUAGES = [
  { value: 'en', labelKey: 'language.en' },
  { value: 'fr', labelKey: 'language.fr' },
  { value: 'es', labelKey: 'language.es' },
  { value: 'ar', labelKey: 'language.ar' },
] as const;

type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]['value'];

type Resources = {
  [key in LanguageCode]: {
    translation: Record<string, unknown>;
  };
};

const resources: Resources = {
  en: {
    translation: {
      languageSwitcher: {
        label: 'Language',
      },
      language: {
        en: 'English',
        fr: 'French',
        es: 'Spanish',
        ar: 'Arabic',
      },
      common: {
        instagramTitle: 'Follow us on Instagram',
        tripAdvisorTitle: 'View us on TripAdvisor',
        signIn: 'Sign In',
        signOut: 'Sign Out',
        orders: 'Orders',
        reservations: 'Reservations',
        takeoutOrder: 'Takeout Order',
        dineInStatus: 'Table {{table}} • Dine In',
        admin: 'Admin',
        adminLoginTitle: 'Admin Login',
        whatsappButton: 'Message the restaurant on WhatsApp',
        reservationQrTitle: 'Reservation QR',
        reservationQrDescription: 'Scan to share your reservation details with staff or companions.',
        reservationConfirmed: 'Reservation confirmed.',
        reservationConfirmedDetailed: 'Reservation confirmed. Table: {{table}} | Party: {{party}} | Total: {{total}}',
        myReservationsTitle: 'My Reservations',
        myReservationsDescription: 'Live updates for your device and account.',
        noItems: 'No items found in this category.',
        pointsBadge: '{{points}} pts',
      },
      menuCard: {
        available: 'Available',
        outOfStock: 'Out of Stock',
        add: 'Add',
        addShort: 'Add',
        unavailable: 'Unavailable',
        unavailableShort: 'N/A',
        fidelityPoints_one: '{{count}} fidelity point',
        fidelityPoints_other: '{{count}} fidelity points',
      },
      categoryFilter: {
        all: 'All Items',
      },
      cart: {
        title_one: 'Your Order ({{count}} item)',
        title_other: 'Your Order ({{count}} items)',
        emptyTitle: 'Your cart is empty',
        emptySubtitle: 'Add some delicious items to get started!',
        each: '{{price}} MAD each',
        subtotal: 'Subtotal',
        loyaltyDiscount: 'Loyalty discount ({{points}} pts)',
        total: 'Total',
        phoneLabel: 'Phone number (optional)',
        phonePlaceholder: 'e.g., +212 6 12 34 56 78',
        phoneInvalid: 'Please enter a valid phone number (8–15 digits).',
        checkout: 'Proceed to Checkout',
      },
      tableSelection: {
        title: 'Welcome to Our Restaurant',
        subtitle: "Let's start your order",
        orderType: 'Order Type',
        dineIn: 'Dine In',
        takeout: 'Takeout',
        tableLabel: 'Table',
        loading: 'Loading tables…',
        selectTable: 'Select your table',
        tableDetected: 'Table {{table}} detected from QR code',
        startOrdering: 'Start Ordering',
        toasts: {
          detectedTitle: 'Table Detected',
          detectedDescription: 'Welcome to Table {{table}}!',
          tableRequiredTitle: 'Table Required',
          tableRequiredDescription: 'Please enter your table number for dine-in orders.',
        },
      },
      toasts: {
        addedTitle: 'Added to cart',
        addedDescription: '{{item}} added to your order',
        removedTitle: 'Item removed',
        removedDescription: 'Item removed from your cart',
        orderPlacedTitle: 'Order Placed!',
        orderPlacedTable: 'Your order has been placed for table {{table}}.',
        orderPlacedTakeout: 'Your order has been placed for takeout.',
        orderPlacedDiscount: 'Saved {{amount}} MAD with loyalty points!',
        orderPlacedPoints: 'Earned {{points}} loyalty points!',
        orderPlacedWaitExact: 'Your wait time is: {{minutes}} minutes.',
        orderPlacedWaitDefault: 'Your wait time is: 15-20 minutes.',
        checkoutErrorTitle: 'Checkout error',
        checkoutErrorDescription: '{{message}}',
        cancelNotAppliedTitle: 'Cancel not applied',
        cancelNotAppliedDescription: 'Reservation not found or not permitted.',
        cancelFailedTitle: 'Cancel failed',
        cancelFailedDescription: 'You may not have permission to cancel this reservation.',
      },
      loyalty: {
        signInPrompt: 'Sign in to use loyalty points',
        loading: 'Loading points...',
        none: 'No loyalty points available',
        use: 'Use Loyalty Points',
        available: '{{points}} points available',
        conversion: '1 point = {{value}} MAD • Max usable: {{max}} points',
        pointsLabel: 'Points to use',
        quickSelect: {
          quarter: '25%',
          half: '50%',
          max: 'Max',
        },
        summaryPoints: 'Points to redeem:',
        summaryDiscount: 'Discount:',
        discountValue: '-{{amount}} MAD',
      },
      reservations: {
        noReservations: 'No reservations yet.',
        filters: {
          all: 'All',
          active: 'Active',
          completed: 'Completed',
        },
        reservationTitle: 'Reservation #{{id}}',
        table: 'Table',
        orderType: 'Order type',
        contact: 'Contact',
        total: 'Total',
        showItems: 'Show items',
        status: {
          pending: 'Pending',
          confirmed: 'Confirmed',
          seated: 'Seated',
          completed: 'Completed',
          cancelled: 'Cancelled',
        },
        cancel: 'Cancel',
      },
    },
  },
  fr: {
    translation: {
      languageSwitcher: {
        label: 'Langue',
      },
      language: {
        en: 'Anglais',
        fr: 'Français',
        es: 'Espagnol',
        ar: 'Arabe',
      },
      common: {
        instagramTitle: 'Suivez-nous sur Instagram',
        tripAdvisorTitle: 'Voir notre page TripAdvisor',
        signIn: 'Se connecter',
        signOut: 'Se déconnecter',
        orders: 'Commandes',
        reservations: 'Réservations',
        takeoutOrder: 'Commande à emporter',
        dineInStatus: 'Table {{table}} • Sur place',
        admin: 'Admin',
        adminLoginTitle: 'Connexion administrateur',
        whatsappButton: 'Contacter le restaurant sur WhatsApp',
        reservationQrTitle: 'QR de réservation',
        reservationQrDescription: 'Scannez pour partager votre réservation avec l’équipe ou vos invités.',
        reservationConfirmed: 'Réservation confirmée.',
        reservationConfirmedDetailed: 'Réservation confirmée. Table : {{table}} | Convives : {{party}} | Total : {{total}}',
        myReservationsTitle: 'Mes réservations',
        myReservationsDescription: 'Suivi en direct pour votre appareil et votre compte.',
        noItems: 'Aucun élément trouvé dans cette catégorie.',
        pointsBadge: '{{points}} pts',
      },
      menuCard: {
        available: 'Disponible',
        outOfStock: 'Rupture de stock',
        add: 'Ajouter',
        addShort: 'Ajouter',
        unavailable: 'Indisponible',
        unavailableShort: 'N/D',
        fidelityPoints_one: '{{count}} point de fidélité',
        fidelityPoints_other: '{{count}} points de fidélité',
      },
      categoryFilter: {
        all: 'Tous les articles',
      },
      cart: {
        title_one: 'Commande ({{count}} article)',
        title_other: 'Commande ({{count}} articles)',
        emptyTitle: 'Votre panier est vide',
        emptySubtitle: 'Ajoutez quelques plats délicieux pour commencer !',
        each: '{{price}} MAD chacun',
        subtotal: 'Sous-total',
        loyaltyDiscount: 'Remise fidélité ({{points}} pts)',
        total: 'Total',
        phoneLabel: 'Numéro de téléphone (facultatif)',
        phonePlaceholder: 'ex. +212 6 12 34 56 78',
        phoneInvalid: 'Veuillez saisir un numéro valide (8–15 chiffres).',
        checkout: 'Passer la commande',
      },
      tableSelection: {
        title: 'Bienvenue dans notre restaurant',
        subtitle: 'Démarrons votre commande',
        orderType: 'Type de commande',
        dineIn: 'Sur place',
        takeout: 'À emporter',
        tableLabel: 'Table',
        loading: 'Chargement des tables…',
        selectTable: 'Choisissez votre table',
        tableDetected: 'Table {{table}} détectée via le QR code',
        startOrdering: 'Commencer la commande',
        toasts: {
          detectedTitle: 'Table détectée',
          detectedDescription: 'Bienvenue à la table {{table}} !',
          tableRequiredTitle: 'Table requise',
          tableRequiredDescription: 'Veuillez indiquer votre numéro de table pour les commandes sur place.',
        },
      },
      toasts: {
        addedTitle: 'Ajouté au panier',
        addedDescription: '{{item}} a été ajouté à votre commande',
        removedTitle: 'Article supprimé',
        removedDescription: 'Article retiré de votre panier',
        orderPlacedTitle: 'Commande validée !',
        orderPlacedTable: 'Votre commande a été enregistrée pour la table {{table}}.',
        orderPlacedTakeout: 'Votre commande à emporter a été enregistrée.',
        orderPlacedDiscount: 'Économies de {{amount}} MAD grâce aux points de fidélité !',
        orderPlacedPoints: 'Vous avez gagné {{points}} points de fidélité !',
        orderPlacedWaitExact: 'Votre temps d’attente est estimé à {{minutes}} minutes.',
        orderPlacedWaitDefault: 'Votre temps d’attente est estimé entre 15 et 20 minutes.',
        checkoutErrorTitle: 'Erreur de paiement',
        checkoutErrorDescription: '{{message}}',
        cancelNotAppliedTitle: 'Annulation impossible',
        cancelNotAppliedDescription: 'Réservation introuvable ou non autorisée.',
        cancelFailedTitle: 'Échec de l’annulation',
        cancelFailedDescription: 'Vous n’avez peut-être pas l’autorisation d’annuler cette réservation.',
      },
      loyalty: {
        signInPrompt: 'Connectez-vous pour utiliser vos points de fidélité',
        loading: 'Chargement des points...',
        none: 'Aucun point de fidélité disponible',
        use: 'Utiliser les points de fidélité',
        available: '{{points}} points disponibles',
        conversion: '1 point = {{value}} MAD • Maximum utilisable : {{max}} points',
        pointsLabel: 'Points à utiliser',
        quickSelect: {
          quarter: '25 %',
          half: '50 %',
          max: 'Max',
        },
        summaryPoints: 'Points à déduire :',
        summaryDiscount: 'Remise :',
        discountValue: '-{{amount}} MAD',
      },
      reservations: {
        noReservations: 'Aucune réservation pour le moment.',
        filters: {
          all: 'Toutes',
          active: 'Actives',
          completed: 'Terminées',
        },
        reservationTitle: 'Réservation n°{{id}}',
        table: 'Table',
        orderType: 'Type de commande',
        contact: 'Contact',
        total: 'Total',
        showItems: 'Afficher les articles',
        status: {
          pending: 'En attente',
          confirmed: 'Confirmée',
          seated: 'Installée',
          completed: 'Terminée',
          cancelled: 'Annulée',
        },
        cancel: 'Annuler',
      },
    },
  },
  es: {
    translation: {
      languageSwitcher: {
        label: 'Idioma',
      },
      language: {
        en: 'Inglés',
        fr: 'Francés',
        es: 'Español',
        ar: 'Árabe',
      },
      common: {
        instagramTitle: 'Síguenos en Instagram',
        tripAdvisorTitle: 'Ver nuestra página en TripAdvisor',
        signIn: 'Iniciar sesión',
        signOut: 'Cerrar sesión',
        orders: 'Pedidos',
        reservations: 'Reservas',
        takeoutOrder: 'Pedido para llevar',
        dineInStatus: 'Mesa {{table}} • En el local',
        admin: 'Admin',
        adminLoginTitle: 'Inicio de sesión administrador',
        whatsappButton: 'Enviar mensaje al restaurante por WhatsApp',
        reservationQrTitle: 'QR de reserva',
        reservationQrDescription: 'Escanea para compartir tu reserva con el personal o tus acompañantes.',
        reservationConfirmed: 'Reserva confirmada.',
        reservationConfirmedDetailed: 'Reserva confirmada. Mesa: {{table}} | Comensales: {{party}} | Total: {{total}}',
        myReservationsTitle: 'Mis reservas',
        myReservationsDescription: 'Actualizaciones en vivo para tu dispositivo y cuenta.',
        noItems: 'No se encontraron artículos en esta categoría.',
        pointsBadge: '{{points}} pts',
      },
      menuCard: {
        available: 'Disponible',
        outOfStock: 'Agotado',
        add: 'Añadir',
        addShort: 'Añadir',
        unavailable: 'No disponible',
        unavailableShort: 'N/D',
        fidelityPoints_one: '{{count}} punto de fidelidad',
        fidelityPoints_other: '{{count}} puntos de fidelidad',
      },
      categoryFilter: {
        all: 'Todos los artículos',
      },
      cart: {
        title_one: 'Tu pedido ({{count}} artículo)',
        title_other: 'Tu pedido ({{count}} artículos)',
        emptyTitle: 'Tu carrito está vacío',
        emptySubtitle: '¡Añade platos deliciosos para empezar!',
        each: '{{price}} MAD cada uno',
        subtotal: 'Subtotal',
        loyaltyDiscount: 'Descuento fidelidad ({{points}} pts)',
        total: 'Total',
        phoneLabel: 'Número de teléfono (opcional)',
        phonePlaceholder: 'p. ej., +212 6 12 34 56 78',
        phoneInvalid: 'Introduce un número válido (8-15 dígitos).',
        checkout: 'Finalizar pedido',
      },
      tableSelection: {
        title: 'Bienvenido a nuestro restaurante',
        subtitle: 'Comencemos tu pedido',
        orderType: 'Tipo de pedido',
        dineIn: 'En el local',
        takeout: 'Para llevar',
        tableLabel: 'Mesa',
        loading: 'Cargando mesas…',
        selectTable: 'Selecciona tu mesa',
        tableDetected: 'Mesa {{table}} detectada desde el código QR',
        startOrdering: 'Comenzar pedido',
        toasts: {
          detectedTitle: 'Mesa detectada',
          detectedDescription: '¡Bienvenido a la mesa {{table}}!',
          tableRequiredTitle: 'Mesa obligatoria',
          tableRequiredDescription: 'Por favor indica tu número de mesa para pedidos en el local.',
        },
      },
      toasts: {
        addedTitle: 'Añadido al carrito',
        addedDescription: '{{item}} se añadió a tu pedido',
        removedTitle: 'Artículo eliminado',
        removedDescription: 'Se eliminó el artículo de tu carrito',
        orderPlacedTitle: '¡Pedido realizado!',
        orderPlacedTable: 'Tu pedido se registró para la mesa {{table}}.',
        orderPlacedTakeout: 'Tu pedido para llevar ha sido registrado.',
        orderPlacedDiscount: '¡Ahorraste {{amount}} MAD con los puntos de fidelidad!',
        orderPlacedPoints: '¡Ganaste {{points}} puntos de fidelidad!',
        orderPlacedWaitExact: 'Tu tiempo de espera es: {{minutes}} minutos.',
        orderPlacedWaitDefault: 'Tu tiempo de espera es: 15-20 minutos.',
        checkoutErrorTitle: 'Error al pagar',
        checkoutErrorDescription: '{{message}}',
        cancelNotAppliedTitle: 'No se pudo cancelar',
        cancelNotAppliedDescription: 'Reserva no encontrada o no permitida.',
        cancelFailedTitle: 'Error al cancelar',
        cancelFailedDescription: 'Puede que no tengas permiso para cancelar esta reserva.',
      },
      loyalty: {
        signInPrompt: 'Inicia sesión para usar tus puntos de fidelidad',
        loading: 'Cargando puntos...',
        none: 'No tienes puntos de fidelidad disponibles',
        use: 'Usar puntos de fidelidad',
        available: '{{points}} puntos disponibles',
        conversion: '1 punto = {{value}} MAD • Máximo utilizable: {{max}} puntos',
        pointsLabel: 'Puntos a usar',
        quickSelect: {
          quarter: '25%',
          half: '50%',
          max: 'Máx',
        },
        summaryPoints: 'Puntos a canjear:',
        summaryDiscount: 'Descuento:',
        discountValue: '-{{amount}} MAD',
      },
      reservations: {
        noReservations: 'Aún no hay reservas.',
        filters: {
          all: 'Todas',
          active: 'Activas',
          completed: 'Completadas',
        },
        reservationTitle: 'Reserva #{{id}}',
        table: 'Mesa',
        orderType: 'Tipo de pedido',
        contact: 'Contacto',
        total: 'Total',
        showItems: 'Mostrar artículos',
        status: {
          pending: 'Pendiente',
          confirmed: 'Confirmada',
          seated: 'En mesa',
          completed: 'Completada',
          cancelled: 'Cancelada',
        },
        cancel: 'Cancelar',
      },
    },
  },
  ar: {
    translation: {
      languageSwitcher: {
        label: 'اللغة',
      },
      language: {
        en: 'الإنجليزية',
        fr: 'الفرنسية',
        es: 'الإسبانية',
        ar: 'العربية',
      },
      common: {
        instagramTitle: 'تابعنا على إنستغرام',
        tripAdvisorTitle: 'شاهدنا على تريب أدفايزر',
        signIn: 'تسجيل الدخول',
        signOut: 'تسجيل الخروج',
        orders: 'الطلبات',
        reservations: 'الحجوزات',
        takeoutOrder: 'طلب سفري',
        dineInStatus: 'طاولة {{table}} • تناول في المكان',
        admin: 'مسؤول',
        adminLoginTitle: 'تسجيل دخول المسؤول',
        whatsappButton: 'راسل المطعم عبر واتساب',
        reservationQrTitle: 'رمز الاستجابة للحجز',
        reservationQrDescription: 'امسح الرمز لمشاركة تفاصيل حجزك مع الفريق أو المرافقين.',
        reservationConfirmed: 'تم تأكيد الحجز.',
        reservationConfirmedDetailed: 'تم تأكيد الحجز. الطاولة: {{table}} | عدد الأشخاص: {{party}} | الإجمالي: {{total}}',
        myReservationsTitle: 'حجوزاتي',
        myReservationsDescription: 'تحديثات فورية لجهازك وحسابك.',
        noItems: 'لا توجد عناصر في هذه الفئة.',
        pointsBadge: '{{points}} نقطة',
      },
      menuCard: {
        available: 'متاح',
        outOfStock: 'غير متوفر',
        add: 'أضف',
        addShort: 'أضف',
        unavailable: 'غير متاح',
        unavailableShort: 'غير متاح',
        fidelityPoints_one: '{{count}} نقطة ولاء',
        fidelityPoints_two: '{{count}} نقطتا ولاء',
        fidelityPoints_few: '{{count}} نقاط ولاء',
        fidelityPoints_many: '{{count}} نقطة ولاء',
        fidelityPoints_other: '{{count}} نقطة ولاء',
      },
      categoryFilter: {
        all: 'جميع الأصناف',
      },
      cart: {
        title_zero: 'طلبك (0 عنصر)',
        title_one: 'طلبك ({{count}} عنصر)',
        title_two: 'طلبك ({{count}} عنصران)',
        title_few: 'طلبك ({{count}} عناصر)',
        title_many: 'طلبك ({{count}} عنصرًا)',
        title_other: 'طلبك ({{count}} عنصر)',
        emptyTitle: 'سلة المشتريات فارغة',
        emptySubtitle: 'أضف بعض الأطباق الشهية للبدء!',
        each: '{{price}} درهم مغربي لكل طبق',
        subtotal: 'الإجمالي الفرعي',
        loyaltyDiscount: 'خصم الولاء ({{points}} نقطة)',
        total: 'الإجمالي',
        phoneLabel: 'رقم الهاتف (اختياري)',
        phonePlaceholder: 'مثال: ‎+212 6 12 34 56 78',
        phoneInvalid: 'يرجى إدخال رقم صالح (من 8 إلى 15 رقمًا).',
        checkout: 'إتمام الطلب',
      },
      tableSelection: {
        title: 'مرحبًا بكم في مطعمنا',
        subtitle: 'لنبدأ طلبك',
        orderType: 'نوع الطلب',
        dineIn: 'تناول في المكان',
        takeout: 'سفري',
        tableLabel: 'الطاولة',
        loading: 'جاري تحميل الطاولات...',
        selectTable: 'اختر طاولتك',
        tableDetected: 'تم التعرف على الطاولة {{table}} من رمز QR',
        startOrdering: 'ابدأ الطلب',
        toasts: {
          detectedTitle: 'تم التعرف على الطاولة',
          detectedDescription: 'مرحبًا بك في الطاولة {{table}}!',
          tableRequiredTitle: 'مطلوب رقم الطاولة',
          tableRequiredDescription: 'يرجى إدخال رقم الطاولة للطلبات داخل المطعم.',
        },
      },
      toasts: {
        addedTitle: 'تمت الإضافة إلى السلة',
        addedDescription: 'تمت إضافة {{item}} إلى طلبك',
        removedTitle: 'تم حذف العنصر',
        removedDescription: 'تم حذف العنصر من سلة المشتريات',
        orderPlacedTitle: 'تم إرسال الطلب!',
        orderPlacedTable: 'تم تسجيل طلبك للطاولة {{table}}.',
        orderPlacedTakeout: 'تم تسجيل طلبك السفري.',
        orderPlacedDiscount: 'وفرت {{amount}} درهمًا مغربيًا باستخدام نقاط الولاء!',
        orderPlacedPoints: 'حصلت على {{points}} نقطة ولاء!',
        orderPlacedWaitExact: 'مدة الانتظار: {{minutes}} دقيقة.',
        orderPlacedWaitDefault: 'مدة الانتظار: 15-20 دقيقة.',
        checkoutErrorTitle: 'خطأ في إتمام الطلب',
        checkoutErrorDescription: '{{message}}',
        cancelNotAppliedTitle: 'تعذر الإلغاء',
        cancelNotAppliedDescription: 'التسجيل غير موجود أو الإلغاء غير مسموح.',
        cancelFailedTitle: 'فشل الإلغاء',
        cancelFailedDescription: 'قد لا تملك صلاحية إلغاء هذا الحجز.',
      },
      loyalty: {
        signInPrompt: 'سجّل الدخول لاستخدام نقاط الولاء',
        loading: 'جاري تحميل النقاط...',
        none: 'لا توجد نقاط ولاء متاحة',
        use: 'استخدم نقاط الولاء',
        available: '{{points}} نقطة متاحة',
        conversion: '1 نقطة = {{value}} درهم مغربي • الحد الأقصى: {{max}} نقطة',
        pointsLabel: 'النقاط المستخدمة',
        quickSelect: {
          quarter: '25%',
          half: '50%',
          max: 'الحد الأقصى',
        },
        summaryPoints: 'النقاط المستبدلة:',
        summaryDiscount: 'الخصم:',
        discountValue: '-{{amount}} درهم',
      },
      reservations: {
        noReservations: 'لا توجد حجوزات بعد.',
        filters: {
          all: 'الكل',
          active: 'النشطة',
          completed: 'المكتملة',
        },
        reservationTitle: 'الحجز رقم {{id}}',
        table: 'الطاولة',
        orderType: 'نوع الطلب',
        contact: 'التواصل',
        total: 'الإجمالي',
        showItems: 'عرض العناصر',
        status: {
          pending: 'قيد الانتظار',
          confirmed: 'مؤكد',
          seated: 'تم الجلوس',
          completed: 'مكتمل',
          cancelled: 'أُلغي',
        },
        cancel: 'إلغاء',
      },
    },
  },
};

const applyDirection = (lng: string) => {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = lng;
  document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
};

const getStoredLanguage = (): LanguageCode | null => {
  if (typeof window === 'undefined') return null;
  const stored = window.localStorage.getItem('appLanguage');
  if (stored && SUPPORTED_LANGUAGES.some(lang => lang.value === stored)) {
    return stored as LanguageCode;
  }
  return null;
};

const getInitialLanguage = (): LanguageCode => {
  const stored = getStoredLanguage();
  if (stored) return stored;
  if (typeof navigator !== 'undefined') {
    const browserLang = navigator.language.split('-')[0];
    if (SUPPORTED_LANGUAGES.some(lang => lang.value === browserLang)) {
      return browserLang as LanguageCode;
    }
  }
  return 'en';
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getInitialLanguage(),
    fallbackLng: 'en',
    supportedLngs: SUPPORTED_LANGUAGES.map(lang => lang.value),
    interpolation: {
      escapeValue: false,
    },
  })
  .then(() => {
    applyDirection(i18n.language);
  });

i18n.on('languageChanged', (lng) => {
  applyDirection(lng);
  if (typeof window !== 'undefined') {
    window.localStorage.setItem('appLanguage', lng);
  }
});

export default i18n;
