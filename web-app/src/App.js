import React from "react";
import { ThemeProvider } from "styled-components";
import { mainTheme } from "./Themes";
import { BrowserRouter as Router, Route } from 'react-router-dom';
import LandingV2 from "./views/LandingV2";
import AccountView from "./views/AccountView";
import { useSpotify } from './SpotifyCallbackHook';

const App = () => {
  return (
    <ThemeProvider theme={mainTheme}>
      <Router>
        <Route exact path="/" component={LandingV2} />
        <Route path="/account" component={AccountView} />
        <Route path="/app_login_callback/:accessToken/:refreshToken/:expiresIn" component={ useSpotify } />
      </Router>
    </ThemeProvider>
  );
};

export default App;
