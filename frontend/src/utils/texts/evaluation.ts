export const EVALUATION_TEXTS = {
  INFORMATIONS: {
    INTRODUCTION: "Les caractéristiques sonores de la parcelle sont :",

    CHARACTERISTICS: {
      MULTI_EXPOSURE:
        "Elle est exposée à plusieurs sources de bruit des transports (selon les cartes de bruits stratégiques : {{sources}})",
      NO_MULTI_EXPOSURE:
        "La parcelle n’est pas exposée à plusieurs sources de bruit des transports (selon les cartes de bruits stratégiques).",

      MAIN_SOURCE_INFRA:
        "Elle est impactée sur <b>{{percent_impacted}}%</b> de sa surface par la source <b>{{typesource}} ({{codinfra}})</b> depuis <b>{{direction}}</b>.",

      MAIN_SOURCE_AGGLO:
        'La parcelle est <b>impactée par une carte de bruit "grande agglomération"</b> qui ne fournit pas le détail des noms de sources mais couvre l\'intégralité du territoire. Si la parcelle est également impactée par une carte de bruit <b>"grande infrastructure"</b>, les niveaux affichés ci-dessous <b>peuvent décrire des sources identiques</b>.',
    },

    EXPOSURE: {
      DAY_AND_NIGHT: {
        INFO: "Elle est exposée de <b>jour</b> comme de <b>nuit</b>",
        NIGHT_LOWER:
          "mais le niveau de <b>nuit est moins impactant</b> que le niveau en journée.",
        DAY_LOWER:
          "mais le niveau en <b>journée est moins impactant</b> que le niveau de nuit.",
      },
    },

    NOISE_LEVELS: {
      LEVEL_INFO:
        "Le niveau maximal sur la parcelle est de <b>{{levelMax}} dB</b>, le niveau minimal est de <b>{{levelMin}} dB</b>.",
      LEVEL_VARIATION_HIGH:
        "Attention, la différence entre le niveau minimal et maximal sur la parcelle indique que la position du bâtiment sera un paramètre acoustique important.",
      LEVEL_VARIATION_LOW:
        "Le niveau est homogène sur la parcelle, la position du bâti n’aura pas un impact important.",
    },

    PRIORITY_ZONE: {
      NOT_IN_PRIORITY_ZONE:
        "Elle ne se situe pas dans une zone prioritaire de lutte contre le bruit des transports terrestres.",
      IN_PRIORITY_ZONE:
        "Elle se situe dans une zone prioritaire de lutte contre le bruit des transports terrestres.",
    },
  },
};
