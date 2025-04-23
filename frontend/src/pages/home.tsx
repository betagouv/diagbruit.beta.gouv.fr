import { Link } from "react-router-dom";
import { tss } from "tss-react/dsfr";

function HomePage() {
  return (
    <div>
      <h1>HOME</h1>
      <Link to="/diagnostic">Diagnostic</Link>
    </div>
  );
}

const useStyles = tss.withName(HomePage.name).create(() => ({
  container: {},
}));

export default HomePage;
