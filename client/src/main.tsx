import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "prismjs";
import "prismjs/components/prism-latex";
import "prismjs/themes/prism-tomorrow.css";

createRoot(document.getElementById("root")!).render(<App />);
