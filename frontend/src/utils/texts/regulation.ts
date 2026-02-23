import { AirIntersection } from "../types";

const PEB_ZONE_D = `<p>Toute construction est autorisée à condition de respecter les mesures d'isolation acoustique réglementaires.</p>`;

const PEB_ZONE_C = `<p><strong>L'essentiel des constructions ne sont pas autorisés</strong> dans cette zone fortement exposée au bruit aérien. Seuls ces bâtiments sont autorisés :</p>
<ul>
  <li>🏫 Équipements publics ou collectifs</li>
  <li>✈️ Logements liés à l'activité aéronautique</li>
  <li>🚜 Logements liés aux activités industrielles, commerciales ou agricoles</li>
  <li>🏠 Maisons individuelles dans les secteurs déjà urbanisés, desservies par les transports publics et sans augmentation de la population exposée au bruit.</li>
</ul>
<p>Toutefois, des dérogations sont accordées pour les reconstructions consécutives à des démolitions en zones A ou B du plan d'exposition au bruit, ainsi que pour les opérations de renouvellement urbain n'entraînant pas d'accroissement de la population exposée.</p>
<p>Les bâtiments existants <strong>peuvent être rénovés</strong>, réhabilités, agrandis ou reconstruits, <strong>à condition de ne pas augmenter le nombre de personnes exposées au bruit</strong>.</p>`;

const PEB_ZONE_B = `<p><strong>L'essentiel des constructions ne sont pas autorisés</strong> dans cette zone fortement exposée au bruit aérien. Seuls ces bâtiments sont autorisés :</p>
<ul>
  <li>✈️ Logements liés à l'activité aéronautique</li>
  <li>🚜 Logements liés aux activités industrielles, commerciales ou agricoles</li>
  <li>👷‍♀️ Équipements publics ou collectifs liés à l'activité aéronautique ou indispensables aux populations existantes</li>
</ul>
<p>Les bâtiments existants <strong>peuvent être rénovés</strong>, réhabilités, agrandis ou reconstruits, <strong>à condition de ne pas augmenter le nombre de personnes exposées au bruit</strong>.</p>`;

const PEB_ZONE_A = `<p><strong>L'essentiel des constructions ne sont pas autorisés</strong> dans cette zone fortement exposée au bruit aérien. Seuls ces bâtiments sont autorisés :</p>
<ul>
  <li>✈️ Logements liés à l'activité aéronautique</li>
  <li>🚜 Logements liés aux activités industrielles, commerciales ou agricoles situés dans les secteurs déjà urbanisés</li>
  <li>👷 Équipements publics ou collectifs liés à l'activité aéronautique ou indispensables aux populations existantes</li>
</ul>
<p>Les bâtiments existants <strong>peuvent être rénovés</strong>, réhabilités, agrandis ou reconstruits, <strong>à condition de ne pas augmenter le nombre de personnes exposées au bruit</strong>.</p>`;

const PEB_TEXTS: Record<string, string> = {
  D: PEB_ZONE_D,
  C: PEB_ZONE_C,
  B: PEB_ZONE_B,
  A: PEB_ZONE_A,
};

export const getPebRegulationTextFromZone = (
  zone: AirIntersection["zone"],
): string | null => {
  if (!zone) return null;
  return PEB_TEXTS[zone] ?? null;
};
