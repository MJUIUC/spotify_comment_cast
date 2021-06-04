import React, { useState } from "react";
import styled from "styled-components";
import { Button } from "semantic-ui-react";
import Wave from "react-wavify";
import daynight from "daynight";
import AxiosInstance from "../AxiosConfig";
import AboutSpotivibe from "./AboutSpotivibe";

const daynightResult = daynight();

const LandingBaseDiv = styled.div`
  background-image: linear-gradient(360deg, black, grey);
`;

const SpotivibeHeader = styled.h1`
  color: white;
  font-size: 10em;
  font-family: "Heebo", sans-serif;
  font-weight: 90;
  @media (max-width: 767px) {
    font-size: 4em;
  }
`;

const HeaderContainer = styled.div`
  display: flex;
  @media (max-width: 767px) {
    flex-direction: column;
    align-items: center;
  }
`;

const ButtonBaseContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 5em;
`;

const AboutLink = styled.a`
  margin-top: 1em;
  color: white;
  &:hover {
    cursor: pointer;
    color: #2ecc40;
  }
`;

const LandingBaseContentDiv = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100vw;
  height: 81vh;
  @media (max-width: 767px) {
    height: 80vh;
  }
`;

const SignInButton = styled(Button)`
  border-radius: 500px !important;
  font-family: "Heebo" !important;
`;

const LandingV2 = () => {
  const [showAbout, toggleShowAbout] = useState(false);
  const signUpClickHandle = async () => {
    try {
      window.location.replace(`${AxiosInstance.defaults.baseURL}/login`);
    } catch (error) {
      console.log(error);
    }
  };

  const aboutClickHandle = () => {
    toggleShowAbout(!showAbout);
  };

  return (
    <LandingBaseDiv>
      <LandingBaseContentDiv>
        <HeaderContainer>
          <SpotifyLogoSvg height={180} width={180} colorfillhex={"#19FF40"} />
          <SpotivibeHeader>Spotivibe</SpotivibeHeader>
        </HeaderContainer>
        <ButtonBaseContainer>
          <SignInButton
            inverted
            onClick={signUpClickHandle}
            color="green"
            content="Sign In"
            size="massive"
          />
          <AboutLink onClick={aboutClickHandle}>About</AboutLink>
        </ButtonBaseContainer>
        {showAbout ? (
          <AboutSpotivibe toggleFunction={aboutClickHandle} />
        ) : null}
      </LandingBaseContentDiv>
      <Wavey />
    </LandingBaseDiv>
  );
};

// Ehh fine for now
const Wavey = () => {
  const width = window.innerWidth;
  return (
    <Wave mask="url(#mask)" fill={daynightResult.light ? "#fff" : "#292929"} options={{height: 1}}>
      <defs>
        <linearGradient id="gradient" gradientTransform="rotate(90)">
          <stop offset="0" stopColor="white" />
          <stop offset="0.5" stopColor="black" />
        </linearGradient>
        <mask id="mask">
          <rect x="0" y="0" width={width} height="200" fill="url(#gradient)" />
        </mask>
      </defs>
    </Wave>
  );
};

const SpotifyLogoSvg = ({ height, width, colorfillhex }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      height={`${height}px`}
      width={`${width}px`}
      version="1.1"
    >
		<defs>
			<filter id="glow">
				<fegaussianblur className="blur" result="coloredBlur" stdDeviation="4"></fegaussianblur>
				<femerge>
          <femergenode in="coloredBlur"></femergenode>
					<femergenode in="SourceGraphic"></femergenode>
				</femerge>
			</filter>
		</defs>
      <path
        fill={colorfillhex}
        d="m83.996 0.277c-46.249 0-83.743 37.493-83.743 83.742 0 46.251 37.494 83.741 83.743 83.741 46.254 0 83.744-37.49 83.744-83.741 0-46.246-37.49-83.738-83.745-83.738l0.001-0.004zm38.404 120.78c-1.5 2.46-4.72 3.24-7.18 1.73-19.662-12.01-44.414-14.73-73.564-8.07-2.809 0.64-5.609-1.12-6.249-3.93-0.643-2.81 1.11-5.61 3.926-6.25 31.9-7.291 59.263-4.15 81.337 9.34 2.46 1.51 3.24 4.72 1.73 7.18zm10.25-22.805c-1.89 3.075-5.91 4.045-8.98 2.155-22.51-13.839-56.823-17.846-83.448-9.764-3.453 1.043-7.1-0.903-8.148-4.35-1.04-3.453 0.907-7.093 4.354-8.143 30.413-9.228 68.222-4.758 94.072 11.127 3.07 1.89 4.04 5.91 2.15 8.976v-0.001zm0.88-23.744c-26.99-16.031-71.52-17.505-97.289-9.684-4.138 1.255-8.514-1.081-9.768-5.219-1.254-4.14 1.08-8.513 5.221-9.771 29.581-8.98 78.756-7.245 109.83 11.202 3.73 2.209 4.95 7.016 2.74 10.733-2.2 3.722-7.02 4.949-10.73 2.739z"
      />
    </svg>
  );
};

export default LandingV2;
