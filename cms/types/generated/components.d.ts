import type { Schema, Struct } from '@strapi/strapi';

export interface GlobalAbout extends Struct.ComponentSchema {
  collectionName: 'components_global_abouts';
  info: {
    description: '';
    displayName: 'about';
  };
  attributes: {
    author: Schema.Attribute.String;
    description: Schema.Attribute.Text;
    profilePicture: Schema.Attribute.Media<'images' | 'files'>;
    source: Schema.Attribute.String;
    textContent: Schema.Attribute.RichText &
    Schema.Attribute.CustomField<
      'plugin::ckeditor5.CKEditor',
      {
        preset: 'defaultHtml';
      }
    >;
  };
}

export interface GlobalAccordion extends Struct.ComponentSchema {
  collectionName: 'components_global_accordions';
  info: {
    displayName: 'accordion';
  };
  attributes: {
    content: Schema.Attribute.RichText &
    Schema.Attribute.CustomField<
      'plugin::ckeditor5.CKEditor',
      {
        preset: 'defaultHtml';
      }
    >;
    title: Schema.Attribute.String;
  };
}

export interface GlobalArray extends Struct.ComponentSchema {
  collectionName: 'components_global_arrays';
  info: {
    description: '';
    displayName: 'Array';
    icon: 'apps';
  };
  attributes: {};
}

export interface GlobalAvailabilityMap extends Struct.ComponentSchema {
  collectionName: 'components_global_availability_maps';
  info: {
    displayName: 'availabilityMap';
  };
  attributes: {
    textContent: Schema.Attribute.RichText &
    Schema.Attribute.CustomField<
      'plugin::ckeditor5.CKEditor',
      {
        preset: 'defaultHtml';
      }
    >;
    title: Schema.Attribute.String;
  };
}

export interface GlobalConditions extends Struct.ComponentSchema {
  collectionName: 'components_global_conditions';
  info: {
    description: '';
    displayName: 'conditions';
    icon: 'oneToMany';
  };
  attributes: {
    isolation_gte: Schema.Attribute.Integer;
    isolation_lte: Schema.Attribute.Integer;
    score_gte: Schema.Attribute.Integer;
    score_lte: Schema.Attribute.Integer;
    source: Schema.Attribute.Enumeration<['all', 'land', 'air', 'multi']> &
    Schema.Attribute.Required &
    Schema.Attribute.DefaultTo<'all'>;
  };
}

export interface GlobalHomeSearch extends Struct.ComponentSchema {
  collectionName: 'components_global_home_searches';
  info: {
    description: '';
    displayName: 'homeSearch';
  };
  attributes: {
    banner: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
    description: Schema.Attribute.RichText &
    Schema.Attribute.CustomField<
      'plugin::ckeditor5.CKEditor',
      {
        preset: 'defaultHtml';
      }
    >;
    title: Schema.Attribute.String;
  };
}

export interface GlobalLink extends Struct.ComponentSchema {
  collectionName: 'components_global_links';
  info: {
    description: '';
    displayName: 'link';
    icon: 'stack';
  };
  attributes: {
    href: Schema.Attribute.String & Schema.Attribute.Required;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface GlobalLocalDocumentationCodeInsee
  extends Struct.ComponentSchema {
  collectionName: 'components_global_local_documentation_code_insees';
  info: {
    description: '';
    displayName: 'LocalDocumentationCodeInsee';
    icon: 'pinMap';
  };
  attributes: {
    codeinsee: Schema.Attribute.String;
  };
}

export interface GlobalMostRecentPreco extends Struct.ComponentSchema {
  collectionName: 'components_global_most_recent_precos';
  info: {
    displayName: 'mostRecentPreco';
  };
  attributes: {
    description: Schema.Attribute.Text;
    title: Schema.Attribute.String;
  };
}

export interface GlobalPartners extends Struct.ComponentSchema {
  collectionName: 'components_global_partners';
  info: {
    description: '';
    displayName: 'partners';
  };
  attributes: {
    description: Schema.Attribute.Text;
    partnersLogos: Schema.Attribute.Media<'images' | 'files', true>;
    title: Schema.Attribute.String;
  };
}

export interface GlobalStats extends Struct.ComponentSchema {
  collectionName: 'components_global_stats';
  info: {
    displayName: 'stats';
  };
  attributes: {
    description: Schema.Attribute.Text;
    sourceLink: Schema.Attribute.String;
    sourceTitle: Schema.Attribute.String;
    title: Schema.Attribute.String;
  };
}

export interface GlobalStatsAndQuiz extends Struct.ComponentSchema {
  collectionName: 'components_global_stats_and_quizs';
  info: {
    displayName: 'stats&quiz';
  };
  attributes: {
    quiz: Schema.Attribute.Component<'global.accordion', true>;
    stats: Schema.Attribute.Component<'global.stats', true>;
    title: Schema.Attribute.String;
  };
}

export interface GlobalTitleTextArray extends Struct.ComponentSchema {
  collectionName: 'components_global_title_text_arrays';
  info: {
    description: '';
    displayName: 'title-text-array';
    icon: 'apps';
  };
  attributes: {
    text: Schema.Attribute.Text;
    title: Schema.Attribute.String;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'global.about': GlobalAbout;
      'global.accordion': GlobalAccordion;
      'global.array': GlobalArray;
      'global.availability-map': GlobalAvailabilityMap;
      'global.conditions': GlobalConditions;
      'global.home-search': GlobalHomeSearch;
      'global.link': GlobalLink;
      'global.local-documentation-code-insee': GlobalLocalDocumentationCodeInsee;
      'global.most-recent-preco': GlobalMostRecentPreco;
      'global.partners': GlobalPartners;
      'global.stats': GlobalStats;
      'global.stats-and-quiz': GlobalStatsAndQuiz;
      'global.title-text-array': GlobalTitleTextArray;
    }
  }
}
