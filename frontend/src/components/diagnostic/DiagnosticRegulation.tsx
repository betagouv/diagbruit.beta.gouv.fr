import { fr, FrIconClassName } from "@codegouvfr/react-dsfr";
import { Accordion } from "@codegouvfr/react-dsfr/Accordion";
import type { ReactNode } from "react";
import { tss } from "tss-react/dsfr";
import useDecrees from "../../hooks/useDecrees";
import useLocalDocumentation from "../../hooks/useLocalDocumentation";
import type { DiagnosticItem } from "../../utils/types";
import DiagnosticReferencesBox from "./DiagnosticReferencesBox";
import RegulationCls from "./regulation/RegulationCls";
import RegulationIsolation from "./regulation/RegulationIsolation";
import RegulationPeb from "./regulation/RegulationPeb";
import RegulationPlu from "./regulation/RegulationPlu";
import Badge from "@codegouvfr/react-dsfr/Badge";
import { getIsMobile } from "../../utils/tools";

type DiagnosticRegulationProps = {
  diagnosticItem: DiagnosticItem;
};

type AccordionConfig = {
  icon: string;
  label: string;
  isAffected: boolean;
  content: ReactNode;
  links: { label: string; url: string }[];
};

const DiagnosticRegulation = ({
  diagnosticItem,
}: DiagnosticRegulationProps) => {
  const { cx, classes } = useStyles();
  const { diagnostic } = diagnosticItem;

  const isMobile = getIsMobile();

  const codedept = parseInt(diagnosticItem.parcelle.code_insee.substring(0, 2), 10);
  const { decrees } = useDecrees(codedept);
  const { localDocumentations } = useLocalDocumentation(
    diagnosticItem.parcelle.code_insee,
  );

  const terrestreLinks = [
    {
      label: "Arrêté du 30 mai 1996",
      url: "https://www.legifrance.gouv.fr/loda/id/LEGIARTI000027804837",
    },
    {
      label: "Arrêté du 23 juillet 2013",
      url: "https://www.legifrance.gouv.fr/loda/id/LEGIARTI000027789290",
    },
    {
      label: "Arrêté du 3 septembre 2013",
      url: "https://www.bulletin-officiel.developpement-durable.gouv.fr/documents/Bulletinofficiel-0027104/met_20130017_0100_0006.pdf;jsessionid=7E0C81517851C74F3F89CE11CC665533",
    },
    ...decrees.map((d) => ({ label: "Arrêté Préfectoral local", url: d.link })),
  ];

  const accordions: AccordionConfig[] = [
    {
      icon: "ri-plane-line",
      label: "Nationale Aérien (PEB)",
      isAffected: diagnostic.air_intersections.length > 0,
      content: <RegulationPeb diagnosticItem={diagnosticItem} />,
      links: [
        {
          label:
            "Récapitulatif des règles d’urbanismes applicables au zones PEB",
          url: "https://www.ecologie.gouv.fr/sites/default/files/documents/prescriptions_urbanisme_applicables_zones_bruits_aerodromes.pdf",
        },
        {
          label: "Informations sur le PEB",
          url: "https://www.ecologie.gouv.fr/politiques-publiques/bruit-organiser-lurbanisation-autour-aeroports",
        },
      ],
    },
    {
      icon: "ri-car-line",
      label: "Nationale Terrestre (Classement sonore)",
      isAffected: diagnostic.soundclassification_intersections.length > 0,
      content: <RegulationCls diagnosticItem={diagnosticItem} />,
      links: terrestreLinks,
    },
    {
      icon: "ri-building-line",
      label: "Locales (PLU)",
      isAffected: diagnostic.noisezone_intersections.length > 0,
      content: <RegulationPlu diagnosticItem={diagnosticItem} />,
      links: [
        ...localDocumentations
          .sort((a, b) => a.priority - b.priority)
          .map((doc) => ({ label: doc.name, url: doc.link })),
      ],
    },
    {
      icon: "ri-voiceprint-line",
      label: "Isolation réglementaire",
      isAffected: !!(diagnostic.isolation_max && diagnostic.isolation_max > 30),
      content: <RegulationIsolation diagnosticItem={diagnosticItem} />,
      links: [],
    },
  ];

  return (
    <div className={cx(fr.cx("fr-accordions-group"), classes.container)}>
      {accordions.map((accordion, index) => (
        <Accordion
          key={index}
          titleAs="h3"
          label={
            <>
              <i className={fr.cx(accordion.icon as FrIconClassName, "fr-mr-1v")} />{" "}
              {accordion.label}

              <div className={cx(classes.badgesContainer)}>
                {accordion.isAffected ? <Badge
                  severity="warning"
                >
                  {isMobile ? "" : "Parcelle exposée"}
                </Badge> : <Badge
                  severity="success"
                >
                  {isMobile ? "" : "Parcelle non exposée"}
                </Badge>}
              </div>
            </>
          }
        >
          {accordion.content}
          {accordion.links.length > 0 && (
            <DiagnosticReferencesBox links={accordion.links} />
          )}
        </Accordion>
      ))}
    </div>
  );
};

const useStyles = tss.create(() => ({
  container: {
    marginBottom: fr.spacing("8v"),
    ".ri-checkbox-circle-fill, .ri-alert-fill": {
      alignSelf: "flex-end",
      marginLeft: "auto",
      "&.ri-checkbox-circle-fill": {
        color: fr.colors.decisions.background.flat.success.default,
      },
      "&.ri-alert-fill": {
        color: fr.colors.decisions.background.flat.warning.default,
      },
    },
    ".fr-collapse--expanded": {
      padding: `${fr.spacing("4v")} ${fr.spacing("2v")}`,
    },
    ".fr-accordion__btn": {
      ...fr.typography[20].style,
    },
    ".fr-accordion__btn::after": {
      marginLeft: fr.spacing("2v"),
    },
  },
  badgesContainer: {
    marginLeft: "auto",
    marginRight: fr.spacing("2v")
  }
}));

export default DiagnosticRegulation;
