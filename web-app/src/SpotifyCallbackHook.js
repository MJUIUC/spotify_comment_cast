import React from "react";
import { useParams, useHistory } from "react-router";
import axios from "axios";

const axiosInstance = axios.create();
axiosInstance.defaults.withCredentials = true;

export let spotifyUser = null;

export const useSpotify = () => {
  const { accessToken, refreshToken, expiresIn } = useParams();
  const history = useHistory();

  React.useEffect(() => {
    (async () => {
      try {
        const result = await axiosInstance.get(
          "http://localhost:8080/api/spotify/logged_in_user",
          {
            params: {
              accessToken,
              refreshToken,
              expiresIn,
            },
          }
        );
        spotifyUser = result.data.body;
        history.push("/account");
      } catch (error) {
        console.log(error);
      }
    })();
  }, [accessToken, refreshToken, expiresIn, history]);

  return null;
};
