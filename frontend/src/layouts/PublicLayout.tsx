import { fr } from "@codegouvfr/react-dsfr";
import Header from "@codegouvfr/react-dsfr/Header";

type PublicLayoutProps = {
  children: React.ReactNode;
};

const PublicLayout = ({ children }: PublicLayoutProps) => {
  return (
    <main>
      <Header
        brandTop={
          <>
            République
            <br />
            Française
          </>
        }
        serviceTitle="DiagBruit"
        homeLinkProps={{
          href: "/",
          title:
            "Accueil - DiagBruit (ministère, secrétariat d‘état, gouvernement)",
        }}
        id="fr-header-simple-header"
      />
      <div className={fr.cx("fr-container", "fr-py-10v")}>{children}</div>
    </main>
  );
};

export default PublicLayout;
