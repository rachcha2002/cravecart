import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "./store/store";
import { CartProvider } from "./contexts/CartContext";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";

// Initialize theme from localStorage
const theme = localStorage.getItem("theme") || "light";
document.documentElement.setAttribute("data-theme", theme);

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <CartProvider>
        <App />
      </CartProvider>
    </Provider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
