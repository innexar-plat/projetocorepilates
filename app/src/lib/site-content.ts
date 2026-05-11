import type { Locale } from '@/i18n/routing';

type TeacherProfile = {
  name: string;
  role: string;
  phoneLabel: string;
  phoneHref: string;
  bio: string;
  focus: string[];
};

type MarketingContent = {
  teachersNavLabel: string;
  preRegisterLabel: string;
  methodSection: {
    eyebrow: string;
    title: string;
    subtitle: string;
    intro: string;
    philosophy: string;
    missionTitle: string;
    missionText: string;
  };
  teacherPage: {
    eyebrow: string;
    title: string;
    subtitle: string;
    focusLabel: string;
    contactLabel: string;
    ctaTitle: string;
    ctaText: string;
    ctaButton: string;
    teachers: TeacherProfile[];
  };
  registrationClosed: {
    eyebrow: string;
    title: string;
    subtitle: string;
    note: string;
  };
  popup: {
    title: string;
    badge: string;
    eyebrow: string;
    subtitle: string;
    note: string;
    dateLabel: string;
    dateValue: string;
    timeLabel: string;
    timeValue: string;
    locationLabel: string;
    locationValue: string;
    highlightsLabel: string;
    highlights: string[];
    teachersLabel: string;
    teachersValue: string;
    primaryCta: string;
    secondaryCta: string;
  };
  preRegistration: {
    eyebrow: string;
    title: string;
    subtitle: string;
    nameLabel: string;
    emailLabel: string;
    phoneLabel: string;
    button: string;
    sending: string;
    success: string;
    disclaimer: string;
  };
  footer: {
    tagline: string;
    addressTitle: string;
    addressLines: string[];
    foundersTitle: string;
    founders: string[];
  };
  login: {
    noAccount: string;
    waitlistLink: string;
  };
};

const CONTENT: Record<Locale, MarketingContent> = {
  en: {
    teachersNavLabel: 'Teachers',
    preRegisterLabel: 'Pre-register',
    methodSection: {
      eyebrow: 'The Method',
      title: 'The Brazilian Core Pilates Method',
      subtitle: 'Where classical movement meets Brazilian soul',
      intro:
        'Together, Fernanda Santos and Cleide Ostroff created the Brazilian Core Pilates Method - an exclusive fusion of classical movement principles with the fluidity, rhythm, energy, and sophistication of Brazilian movement culture.',
      philosophy:
        'More than exercise, Brazilian Core Pilates is a movement philosophy designed to transform the body through strength, posture, balance, flexibility, mindfulness, and intentional movement.',
      missionTitle: 'Our mission',
      missionText:
        'Brazilian Core Pilates - where classical movement meets Brazilian soul.',
    },
    teacherPage: {
      eyebrow: 'Meet the founders',
      title: 'Founders who lead with precision, purpose and Brazilian energy',
      subtitle:
        'Brazilian Core Pilates is led by two founders who blend movement science, wellness expertise, and a refined boutique experience in Sebastian.',
      focusLabel: 'Special focus',
      contactLabel: 'Direct contact',
      ctaTitle: 'Pre-register before full enrollment opens',
      ctaText:
        'Our general signup is temporarily closed while we prepare the opening. Join the pre-registration list and the admin team will follow up from the panel.',
      ctaButton: 'Join pre-registration',
      teachers: [
        {
          name: 'Fernanda Santos',
          role: 'Founder and Pilates teacher',
          phoneLabel: '(772) 404-9031',
          phoneHref: '17724049031',
          bio:
            'Fernanda Santos brings strength, discipline, and movement expertise to Brazilian Core Pilates. A Black Belt in Jiu-Jitsu, Personal Trainer, Pilates Instructor, and Massage Therapist with more than 12 years of experience, Fernanda combines technical precision with deep body awareness and functional movement training. Her passion for movement, performance, rehabilitation, and body conditioning helped shape the foundation of the Brazilian Core Pilates method - creating classes that are powerful, intelligent, and transformative.',
          focus: ['Functional movement', 'Performance and conditioning', 'Rehabilitation and body awareness'],
        },
        {
          name: 'Cleide Ostroff',
          role: 'Founder and Pilates teacher',
          phoneLabel: '(321) 490-2035',
          phoneHref: '13214902035',
          bio:
            'Cleide Ostroff brings vision, wellness, and a holistic movement philosophy to Brazilian Core Pilates. With a background as a Medical Assistant, Personal Trainer, Pilates Instructor, Psychoanalyst, and entrepreneur for more than 24 years, Cleide combines health, posture, movement, mind-body connection, leadership, and emotional well-being into a refined and transformative movement experience. Her vision was to create more than a studio - a concept where elegance, strength, wellness, and Brazilian energy move together to inspire confidence, balance, and quality of life.',
          focus: ['Mind-body connection', 'Holistic wellness', 'Leadership and transformation'],
        },
      ],
    },
    registrationClosed: {
      eyebrow: 'Pre-registration only',
      title: 'New account registration is temporarily closed',
      subtitle:
        'We are organizing the opening phase and onboarding manually for now. Leave your details below and the team will contact you from the admin panel.',
      note: 'Your form is saved as a lead for the admin team.',
    },
    popup: {
      title: 'Grand Opening and pre-registration',
      badge: 'June 6th, 2026',
      eyebrow: 'Limited opening event',
      subtitle: 'Celebrate the opening, meet the founders and reserve your spot before enrollment opens to everyone.',
      note: 'Boutique classes, founder guidance and priority access for the first students on the list.',
      dateLabel: 'Date',
      dateValue: 'Saturday, June 6th, 2026',
      timeLabel: 'Time',
      timeValue: '10:00 AM to 2:00 PM',
      locationLabel: 'Location',
      locationValue: '11606 US Highway #1, Sebastian, FL 32958',
      highlightsLabel: 'What to expect',
      highlights: ['Grand opening welcome experience', 'Studio tour with personalized guidance', 'Priority pre-registration before public enrollment'],
      teachersLabel: 'Founders',
      teachersValue: 'Fernanda Santos and Cleide Ostroff',
      primaryCta: 'Meet the teachers',
      secondaryCta: 'Continue to form',
    },
    preRegistration: {
      eyebrow: 'Opening list',
      title: 'Join the priority list',
      subtitle: 'Leave your details to receive launch updates, availability and direct follow-up from the team.',
      nameLabel: 'Full name',
      emailLabel: 'Email',
      phoneLabel: 'Phone',
      button: 'Join the list',
      sending: 'Saving...',
      success: 'Pre-registration received. Our team will contact you soon.',
      disclaimer: 'This form goes directly to the admin leads panel.',
    },
    footer: {
      tagline: 'Boutique Pilates studio in Sebastian, Florida. Purposeful movement, warm guidance and premium attention from the founders.',
      addressTitle: 'Address',
      addressLines: ['11606 US Highway #1', 'Sebastian, FL 32958'],
      foundersTitle: 'Founders',
      founders: ['Fernanda Santos  (772) 404-9031', 'Cleide Ostroff  (321) 490-2035'],
    },
    login: {
      noAccount: 'Not enrolled yet?',
      waitlistLink: 'Join the pre-registration list',
    },
  },
  pt: {
    teachersNavLabel: 'Professoras',
    preRegisterLabel: 'Pre-cadastro',
    methodSection: {
      eyebrow: 'Introducao',
      title: 'Onde o Pilates Classico encontra a energia brasileira',
      subtitle: 'Bem-vinda a Brazilian Core Pilates',
      intro:
        'A Brazilian Core Pilates e um studio boutique criado para oferecer mais do que exercicio. Entregamos uma experiencia elevada de movimento, forca, postura e confianca em todas as fases da vida.',
      philosophy:
        'Nosso metodo une as bases do Pilates classico com um toque brasileiro unico: energia, elegancia, ritmo e cuidado em cada detalhe. De iniciantes ao publico de active aging, cada sessao foi pensada para que voce se sinta mais forte, equilibrada e conectada ao proprio corpo.',
      missionTitle: 'Nossa missao',
      missionText:
        'Na Brazilian Core Pilates, acreditamos que Pilates nao e apenas uma sequencia de exercicios. E um estilo de vida, uma filosofia e uma forma poderosa de transformar o corpo de dentro para fora. Nossa missao e ajudar voce a se mover com proposito, fortalecer o core, melhorar a postura e se sentir confiante no proprio corpo.',
    },
    teacherPage: {
      eyebrow: 'Conheca as fundadoras',
      title: 'Professoras que conduzem com cuidado, precisao e energia brasileira',
      subtitle:
        'A Brazilian Core Pilates e conduzida por duas fundadoras focadas em movimento personalizado, acolhimento e uma experiencia premium em Sebastian.',
      focusLabel: 'Foco principal',
      contactLabel: 'Contato direto',
      ctaTitle: 'Entre no pre-cadastro antes da abertura total das matriculas',
      ctaText:
        'O cadastro geral esta temporariamente bloqueado enquanto preparamos a inauguracao. Entre na lista de pre-cadastro e a equipe retornara pelo painel admin.',
      ctaButton: 'Entrar no pre-cadastro',
      teachers: [
        {
          name: 'Fernanda Santos',
          role: 'Fundadora e professora de Pilates',
          phoneLabel: '(772) 404-9031',
          phoneHref: '17724049031',
          bio:
            'Fernanda conduz alunas com uma abordagem calma e estruturada, focada em postura, confianca e forca sustentavel. Suas aulas equilibram tecnica, incentivo e atencao individual a cada corpo.',
          focus: ['Pilates para base tecnica', 'Postura e mobilidade', 'Acolhimento de novas alunas'],
        },
        {
          name: 'Cleide Ostroff',
          role: 'Fundadora e professora de Pilates',
          phoneLabel: '(321) 490-2035',
          phoneHref: '13214902035',
          bio:
            'Cleide traz um estilo de ensino energetico, centrado em movimento com proposito, constancia e consciencia corporal. Ela ajuda cada aluna a evoluir com seguranca e motivacao.',
          focus: ['Forca de core', 'Movimento funcional', 'Planos progressivos de treino'],
        },
      ],
    },
    registrationClosed: {
      eyebrow: 'Somente pre-cadastro',
      title: 'O cadastro de novas contas esta temporariamente bloqueado',
      subtitle:
        'Estamos organizando a fase de inauguracao e o onboarding manual neste momento. Deixe seus dados abaixo e a equipe vai entrar em contato pelo painel admin.',
      note: 'Seu formulario sera salvo como lead para a equipe administrativa.',
    },
    popup: {
      title: 'Inauguracao e pre-cadastro',
      badge: '06 de junho de 2026',
      eyebrow: 'Evento de abertura com vagas limitadas',
      subtitle: 'Comemore a abertura, conheca as fundadoras e reserve sua vaga antes da liberacao geral das matriculas.',
      note: 'Aulas boutique, acompanhamento das fundadoras e acesso prioritario para as primeiras alunas da lista.',
      dateLabel: 'Data',
      dateValue: 'Sabado, 06 de junho de 2026',
      timeLabel: 'Horario',
      timeValue: '10:00 AM as 2:00 PM',
      locationLabel: 'Local',
      locationValue: '11606 US Highway #1, Sebastian, FL 32958',
      highlightsLabel: 'O que vai ter',
      highlights: ['Experiencia especial de inauguracao', 'Visita ao studio com orientacao personalizada', 'Pre-cadastro prioritario antes da abertura publica'],
      teachersLabel: 'Fundadoras',
      teachersValue: 'Fernanda Santos e Cleide Ostroff',
      primaryCta: 'Conhecer professoras',
      secondaryCta: 'Ir para o formulario',
    },
    preRegistration: {
      eyebrow: 'Lista de abertura',
      title: 'Entre na lista prioritaria',
      subtitle: 'Deixe seus dados para receber novidades do lancamento, disponibilidade e retorno direto da equipe.',
      nameLabel: 'Nome completo',
      emailLabel: 'Email',
      phoneLabel: 'Telefone',
      button: 'Entrar na lista',
      sending: 'Salvando...',
      success: 'Pre-cadastro recebido. Nossa equipe vai falar com voce em breve.',
      disclaimer: 'Este formulario vai direto para o painel de leads do admin.',
    },
    footer: {
      tagline: 'Studio boutique de Pilates em Sebastian, Florida. Movimento com proposito, acolhimento e atencao premium das fundadoras.',
      addressTitle: 'Endereco',
      addressLines: ['11606 US Highway #1', 'Sebastian, FL 32958'],
      foundersTitle: 'Fundadoras',
      founders: ['Fernanda Santos  (772) 404-9031', 'Cleide Ostroff  (321) 490-2035'],
    },
    login: {
      noAccount: 'Ainda nao faz parte?',
      waitlistLink: 'Entrar no pre-cadastro',
    },
  },
  es: {
    teachersNavLabel: 'Profesoras',
    preRegisterLabel: 'Pre-registro',
    methodSection: {
      eyebrow: 'Introduccion',
      title: 'Donde el Pilates clasico se encuentra con la energia brasilena',
      subtitle: 'Bienvenida a Brazilian Core Pilates',
      intro:
        'Brazilian Core Pilates es un studio boutique creado para ofrecer mas que ejercicio. Brindamos una experiencia elevada de movimiento, fuerza, postura y confianza en cada etapa de la vida.',
      philosophy:
        'Nuestro metodo une las bases del Pilates clasico con un toque brasileno unico: energia, elegancia, ritmo y cuidado en cada detalle. Desde principiantes hasta clientes de envejecimiento activo, cada sesion esta disenada para ayudarte a sentirte mas fuerte, equilibrada y conectada con tu cuerpo.',
      missionTitle: 'Nuestra mision',
      missionText:
        'En Brazilian Core Pilates creemos que Pilates no es solo una secuencia de ejercicios. Es un estilo de vida, una filosofia y una forma poderosa de transformar el cuerpo desde adentro hacia afuera. Nuestra mision es ayudarte a moverte con proposito, fortalecer tu core, mejorar tu postura y sentirte segura en tu propio cuerpo.',
    },
    teacherPage: {
      eyebrow: 'Conoce a las fundadoras',
      title: 'Profesoras que guian con cuidado, precision y energia brasilena',
      subtitle:
        'Brazilian Core Pilates esta dirigida por dos fundadoras enfocadas en movimiento personalizado, acompanamiento cercano y una experiencia premium en Sebastian.',
      focusLabel: 'Enfoque principal',
      contactLabel: 'Contacto directo',
      ctaTitle: 'Entra en el pre-registro antes de abrir las inscripciones',
      ctaText:
        'El registro general esta temporalmente bloqueado mientras preparamos la inauguracion. Entra en la lista y el equipo te respondera desde el panel admin.',
      ctaButton: 'Entrar al pre-registro',
      teachers: [
        {
          name: 'Fernanda Santos',
          role: 'Fundadora y profesora de Pilates',
          phoneLabel: '(772) 404-9031',
          phoneHref: '17724049031',
          bio:
            'Fernanda acompana a sus alumnas con un enfoque sereno y estructurado, centrado en postura, confianza y fuerza sostenible. Sus clases combinan tecnica, motivacion y atencion individual.',
          focus: ['Pilates de base tecnica', 'Postura y movilidad', 'Acompanamiento para nuevas alumnas'],
        },
        {
          name: 'Cleide Ostroff',
          role: 'Fundadora y profesora de Pilates',
          phoneLabel: '(321) 490-2035',
          phoneHref: '13214902035',
          bio:
            'Cleide aporta un estilo energetico, centrado en movimiento con proposito, constancia y consciencia corporal. Ayuda a cada alumna a progresar con seguridad y motivacion.',
          focus: ['Fuerza del core', 'Movimiento funcional', 'Planes progresivos de entrenamiento'],
        },
      ],
    },
    registrationClosed: {
      eyebrow: 'Solo pre-registro',
      title: 'El registro de nuevas cuentas esta temporalmente bloqueado',
      subtitle:
        'Estamos organizando la fase de inauguracion y el onboarding manual por ahora. Deja tus datos abajo y el equipo te contactara desde el panel admin.',
      note: 'Tu formulario se guardara como lead para el equipo administrativo.',
    },
    popup: {
      title: 'Inauguracion y pre-registro',
      badge: '6 de junio de 2026',
      eyebrow: 'Evento de apertura con cupos limitados',
      subtitle: 'Celebra la apertura, conoce a las fundadoras y reserva tu lugar antes de la apertura general de inscripciones.',
      note: 'Clases boutique, acompanamiento de las fundadoras y acceso prioritario para las primeras alumnas de la lista.',
      dateLabel: 'Fecha',
      dateValue: 'Sabado, 6 de junio de 2026',
      timeLabel: 'Horario',
      timeValue: '10:00 AM a 2:00 PM',
      locationLabel: 'Lugar',
      locationValue: '11606 US Highway #1, Sebastian, FL 32958',
      highlightsLabel: 'Que habra',
      highlights: ['Experiencia especial de inauguracion', 'Recorrido por el studio con orientacion personalizada', 'Pre-registro prioritario antes de la apertura publica'],
      teachersLabel: 'Fundadoras',
      teachersValue: 'Fernanda Santos y Cleide Ostroff',
      primaryCta: 'Conocer profesoras',
      secondaryCta: 'Ir al formulario',
    },
    preRegistration: {
      eyebrow: 'Lista de apertura',
      title: 'Entra en la lista prioritaria',
      subtitle: 'Deja tus datos para recibir novedades del lanzamiento, disponibilidad y seguimiento directo del equipo.',
      nameLabel: 'Nombre completo',
      emailLabel: 'Correo',
      phoneLabel: 'Telefono',
      button: 'Entrar en la lista',
      sending: 'Guardando...',
      success: 'Pre-registro recibido. Nuestro equipo te contactara pronto.',
      disclaimer: 'Este formulario va directo al panel admin de leads.',
    },
    footer: {
      tagline: 'Studio boutique de Pilates en Sebastian, Florida. Movimiento con proposito, cercania y atencion premium de las fundadoras.',
      addressTitle: 'Direccion',
      addressLines: ['11606 US Highway #1', 'Sebastian, FL 32958'],
      foundersTitle: 'Fundadoras',
      founders: ['Fernanda Santos  (772) 404-9031', 'Cleide Ostroff  (321) 490-2035'],
    },
    login: {
      noAccount: 'Todavia no estas inscrita?',
      waitlistLink: 'Entrar al pre-registro',
    },
  },
};

export function getMarketingContent(locale: Locale): MarketingContent {
  return CONTENT[locale];
}