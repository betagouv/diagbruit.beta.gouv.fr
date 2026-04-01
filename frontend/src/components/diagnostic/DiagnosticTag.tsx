import { Tag } from "@codegouvfr/react-dsfr/Tag";

type DiagnosticTagProps = {
    ambience: string;
    className?: string;
};

const DiagnosticTag = ({ ambience, className }: DiagnosticTagProps) => (
    <Tag className={className}>{ambience}</Tag>
);

export default DiagnosticTag;