import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Routes from "./Routes";
import { RootProvider } from "./contexts/RootProvider";
import { NotificationProvider } from "./contexts/NotificationContext";

const App: React.FC = () => {
  return (
    <Router>
      <RootProvider>
        <NotificationProvider>
          <Toaster position="top-right" />
          <Routes />
        </NotificationProvider>
      </RootProvider>
    </Router>
  );
};

export default App;
