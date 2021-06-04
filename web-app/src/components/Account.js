import React from "react";
import styled from "styled-components";
import { Header, Button } from "semantic-ui-react";
import Loader from "react-loader-spinner";

import AxiosInstance from '../AxiosConfig';

const ProfileImage = styled.img`
  box-shadow: 0 0 0 3px white;
  border-radius: 50%;
  height: 250px;
  width: 250px;
`;

const AccountBaseContainer = styled.div`
  padding-top: 5vh;
`;

const AccountHeader = styled(Header)`
  color: white;
  text-align: center;
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: center;
`;

const spotifyProductImageUrl =
  "https://developer.spotify.com/assets/branding-guidelines/icon3@2x.png";

const Account = ({ user, userLoadingState, removeUser }) => {

  const signUpClickHandle = async () => {
    try {
      window.location.replace(`${AxiosInstance.defaults.baseURL}/login`);
    } catch (error) {
      console.log(error);
    }
  };

  const signOutClickHandle = async () => {
    try {
      await AxiosInstance.get("/logout");
      removeUser();
    } catch (error) {
      console.log(error);
    }
  };

  if (userLoadingState && !user) {
    return (
      <AccountBaseContainer>
        <Loader type="Bars" color="#fff" height={100} width={100} />
      </AccountBaseContainer>
    );
  } else if (user && !userLoadingState) {
    console.log(user);
    const HeaderString = `Hey There ${user.display_name}!`.trim();
    const imageUrl = user.images[0].url
    return (
      <AccountBaseContainer>
        <ProfileImage src={imageUrl} circular />;
        <AccountHeader as="h1">{HeaderString}</AccountHeader>
        <ButtonContainer>
          <Button content="sign out" onClick={signOutClickHandle} inverted color='green'/>
        </ButtonContainer>
      </AccountBaseContainer>
    );
  } else if (!user && !userLoadingState) {
    return (
      <AccountBaseContainer>
        <ProfileImage src={spotifyProductImageUrl} circular />
        <ButtonContainer>
          <Button content="sign in" onClick={signUpClickHandle} inverted color='green'/>
        </ButtonContainer>
      </AccountBaseContainer>
    );
  }
};

export default Account;
