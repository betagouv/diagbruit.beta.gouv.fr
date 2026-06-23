import { fr } from "@codegouvfr/react-dsfr";
import Accordion from "@codegouvfr/react-dsfr/Accordion";
import axios from "axios";
import { useEffect, useState } from "react";

const DiagnosticAcousticCertificate = () => {
    const [content, setContent] = useState<any>(null);

    useEffect(() => {
        axios
            .get(`${process.env.REACT_APP_CMS_URL}/api/acoustic-certificate`)
            .then((res) => {
                setContent(res.data.data);
            })
            .catch((err) => {
                console.error(err);
            });
    }, []);

    return (<div className={fr.cx("fr-mb-4v")}>
        {content && (
            <>
                <h4 className={fr.cx("fr-h6", "fr-mb-3v")}>Concernant votre projet</h4>
                <Accordion
                    titleAs="h3"
                    label={
                        <>
                            <i className={fr.cx("fr-mr-1v", "fr-icon-checkbox-circle-line")} />
                            Attestation acoustique
                        </>
                    }
                >
                    <div dangerouslySetInnerHTML={{ __html: content.content }}></div>
                </Accordion>
            </>

        )}
    </div>)
}

export default DiagnosticAcousticCertificate;