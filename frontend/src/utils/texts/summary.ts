import { AirIntersection, IntRange } from "../types";

const generateAerialContent = (
  context: typeof SUMMARY_TEXTS.CONTENT.AERIAL,
  zone: AirIntersection["zone"] | "UNKNOWN"
) => {
  switch (zone) {
    case "A":
    case "B":
      return `
          ${context.COMMON.INTRO}
          ${context.COMMON.URBANISME_AB}
          ${context.COMMON.ISOLATION_HELP}
        `;
    case "C":
      return `
          ${context.COMMON.INTRO}
          ${context.COMMON.URBANISME_C}
          ${context.COMMON.ISOLATION_HELP}
        `;
    case "D":
      return `
          ${context.COMMON.URBANISME_D}
          ${context.COMMON.ISOLATION_HELP}
        `;
    default:
      return "";
  }
};

const generateLandContent = (
  context: typeof SUMMARY_TEXTS.CONTENT.LAND,
  risk: IntRange<0, 4>,
  isMultiExposed: boolean
) => {
  if (isMultiExposed) {
    return `
          ${risk === 0 ? context.MULTI.INTRO_LIGHT : context.MULTI.INTRO_STRONG}
          ${context.COMMON.CONCLUSION}
      `;
  }

  return `
        ${context.COMMON[`RISK_${risk}`]}
        ${context.COMMON.CONCLUSION}
    `;
};

const generateMultiAirLandContent = (
  context: typeof SUMMARY_TEXTS.CONTENT.MULTI,
  risk: IntRange<0, 4>
) => {
  return `
        ${risk === 0 ? context.COMMON.INTRO_LIGHT : context.COMMON.INTRO_STRONG}
        ${context.COMMON.CONCLUSION}
    `;
};

export const SUMMARY_TEXTS = {
  INTRODUCTION: {
    RISK_0: `<p>Tout ou partie de cette parcelle est soumise à des niveaux de bruit potentiellement désagréables. Pour atteindre des ressentis acceptables, <b>plusieurs solutions sont envisageables (sans besoin de cumul)</b> : action sur l'aménagement / la position du bâti, action sur l'environnement sonore global (présence de bruit "positifs").</p>`,
    RISK_1: `<p>Sur tout ou partie de cette parcelle, dans des situations où <b>l'isolation acoustique obligatoire</b> n'entre pas en compte (fenêtre ouverte, terrasse, jardin), une partie de la population pourrait être significativement gênée.</p>`,
    RISK_2: `<p>Sur tout ou partie de cette parcelle, dans des situations où <b>l'isolation acoustique obligatoire</b> n'entre pas en compte (fenêtre ouverte, terrasse, jardin), la gêne pourrait être importante.</p>`,
    RISK_3: `<p>Sur tout ou partie de cette parcelle, dans des situations où <b>l'isolation acoustique obligatoire</b> n'entre pas en compte (fenêtre ouverte, terrasse, jardin), la gêne pourrait être très importante.</p>`,
  },

  CONCLUSIONS: {
    RISK_0: ``,
    RISK_1: `<p><b> Une visite des lieux peut aider à déterminer la sensibilité de chacun.</b></p>`,
    RISK_HIGH: `<p><b>Il est vivement conseillé de visiter les lieux avant toute prise de décision.</b></p>`,
  },

  CONTENT: {
    AERIAL: {
      COMMON: {
        INTRO: `<p>La nature de la source (bruit d'origine aérienne) limite très fortement les possibilités d'actions.</p>`,
        ISOLATION_HELP: `<p><b>Le gestionnaire de la source de bruit n'a aucune obligation légale de résorption, mais des aides à l'isolation existent sous conditions.</b></p>`,
        URBANISME_AB: `<p><b>Le code de l'urbanisme interdit toute nouvelle construction de logement ou d'équipement publics hormis ceux nécessaires au fonctionnement de l'aéroport.</b></p>`,
        URBANISME_C: `<p><b>Le code de l'urbanisme n'autorise que la construction d'équipement publics ou la réalisation de programme de renouvellement urbain</b>.</p>`,
        URBANISME_D: `<p><b>Le code de l'urbanisme impose l'isolation du bâtiment.</b></p>`,
      },

      generateContent: function (zone: AirIntersection["zone"] | "UNKNOWN") {
        return generateAerialContent(this, zone);
      },
    },
    LAND: {
      COMMON: {
        CONCLUSION: `
              <p><b>La parcelle est soumise à une obligation règlementaire d'isolation.</b></p>
              <p><b>Le gestionnaire de la source de bruit n'a aucune obligation légale de résorption.</b></p>
            `,
        RISK_0: ``,
        RISK_1: `<p>Pour atteindre des niveaux acceptables, <b>plusieurs solutions sont envisageables (sans besoin de cumul)</b> : action sur l'aménagement / la position du bâti, action sur la propagation (mur, obstacle, …), actions à la source (vitesse, revêtement, …).</p>`,
        RISK_2: `<p>Pour atteindre des niveaux acceptables, <b>plusieurs solutions devront être étudiées</b> : action sur l'aménagement / la position du bâti, action sur la propagation (mur, obstacle, …), actions à la source (vitesse, revêtement, …).</p>`,
        RISK_3: `<p>Pour atteindre des niveaux acceptables, <b>plusieurs solutions devront être étudiées</b> : action sur l'aménagement / la position du bâti, action sur la propagation (mur, obstacle, …), actions à la source (vitesse, revêtement, …).</p>`,
      },

      MULTI: {
        INTRO_LIGHT: `<p><b>La parcelle est multi-exposée à des bruits de sources terrestres.</b></p>`,
        INTRO_STRONG: `<p><b>La parcelle est multi-exposée à des bruits de sources terrestres.</b> La nature et l'efficacité des solutions envisageable dépend de l'importance de la nuisance de chacune des sources.</p>`,
      },

      generateContent: function (
        risk: IntRange<0, 4>,
        isMultiExposed: boolean
      ) {
        return generateLandContent(this, risk, isMultiExposed);
      },
    },
    MULTI: {
      COMMON: {
        INTRO_LIGHT: `<p><b>La parcelle est multi-exposée à des bruits de sources terrestres et aérienne.</b></p>`,
        INTRO_STRONG: `<p><b>La parcelle est multi-exposée à des bruits de sources terrestres et aérienne.</b> La nature et l'efficacité des solutions envisageable dépend de l'importance de la nuisance de chacune des sources.</p>`,
        CONCLUSION: `
            <p><b>La parcelle est soumise à une obligation règlementaire d'isolation.</b></p>
            <p><b>Les gestionnaire des sources de bruit n'ont aucune obligation légale de résorption, mais des aides à l'isolation existent sous conditions pour le bruit aérien.</b></p>
          `,
      },

      generateContent: function (risk: IntRange<0, 4>) {
        return generateMultiAirLandContent(this, risk);
      },
    },
  },

  NO_ISSUE: `<p>Le bruit des transport n'est pas un enjeu sur cette parcelle.</p>`,
  NO_ISSUE_WITH_ISOLATION: `<p>Le bruit des transport n'est pas un enjeu sur cette parcelle, bien qu'elle soit <b>soumise à une obligation règlementaire d'isolation.</b></p>`,

  CLASSIFICATION_WARNING: `
      <p>Cette parcelle est soumise à une carte de bruit des grandes infrastructure de transport terrestres (route de plus de 8200 veh/j ou voie ferrée de plus de 82 trains par jours) mais n'est pas soumise au classement sonore.</p>
  
      <p>Cette situation traduit soit :
        <ul>
          <li>un manque dans le classement sonore et donc un risque de sous protection des populations sur cette parcelle</li>
          <li>une erreur dans les cartes de bruit et donc une surprotection sur cette parcelle.</li>
        </ul>
      </p>
  
      <p>Dans le doute, il est conseillé de se rapprocher des services :
        <ul>
          <li>en charge de l'élaboration des cartes de bruit et du classement sonore (DDTM)</li>
          <li>du gestionnaire de l'infrastructure pour connaitre les niveaux de trafic réels</li>
        </ul>
      </p>
  
      <p>Enfin, le priorité devrait etre donnée à une éventuelle surprotection des populations.</p>
    `,
};
