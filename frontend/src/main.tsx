import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { rootStore } from "./stores/redux/store";
import { App } from "./App";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <Provider store={rootStore}>
    <App />
  </Provider>
);
