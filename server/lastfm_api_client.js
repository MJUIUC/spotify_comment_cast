const axios = require("axios");
const config = require("./config");
const { lastFmApiKey } = config;
const { processTags } = require('./lastfm_top_tag_processor');

const lastFmAxiosInstance = axios.create();
lastFmAxiosInstance.defaults.baseURL = `http://ws.audioscrobbler.com/2.0/`;

class LastFmClient {
  constructor() {
    this.axiosInstance = lastFmAxiosInstance;
  }

  async requestAuth(api_key) {
    try {
      const result = await this.axiosInstance.get(`auth/?api_key${api_key}`);
      return result.data;
    } catch (error) {
      console.log(error);
    }
  }

  async albumGetInfo(album_name, artist_name) {
    try {
      const result = await this.axiosInstance.get(
        `?method=album.getInfo&album=${album_name}&artist=${artist_name}&limit=${1}&api_key=${lastFmApiKey}&format=json`
      );
      return result.data;
    } catch (error) {
      console.log(error);
    }
  }

  async albumGetTags(album_name, artist_name) {
    try {
      const result = await this.axiosInstance.get(
        `?method=album.getTopTags&album=${album_name}&artist=${artist_name}&limit=${1}&api_key=${lastFmApiKey}&format=json`
      );
      return result.data;
    } catch (error) {
      console.log(error);
    }
  }

  async artistGetTags(artist_name) {
    try {
      const result = await this.axiosInstance.get(
        `?method=artist.getTopTags&artist=${artist_name}&api_key=${lastFmApiKey}&format=json`
      );
      // const processedTags = processTags(result.data);
      return result.data;
    } catch (error) {
      console.log(error);
    }
  }

  async getTopTags() {
    try {
      const result = await this.axiosInstance.get(
        `?method=tag.getTopTags&api_key=${lastFmApiKey}&format=json`
      );
      return result.data;
    } catch (error) {
      console.log(error);
    }
  }
}

module.exports = LastFmClient;
