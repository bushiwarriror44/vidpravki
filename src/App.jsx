import { BrowserRouter as Router } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./css/common/reset.css";
import "./css/common/Global.less";
import AppContent from "./AppContent";

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
