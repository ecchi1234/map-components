import 'reflect-metadata';
// import { notification } from 'helpers';

import { Geocoder, HereProvider } from '@goparrot/geocoder';

import Axios, { AxiosInstance } from 'axios';

const axios: AxiosInstance = Axios.create();

const provider: HereProvider = new HereProvider(
  axios,
  process.env.REACT_APP_HERE_ID,
  process.env.REACT_APP_HERE_CODE,
);

const geocoder: Geocoder = new Geocoder(provider);
export class SearchService {
  // geoCodingService: H.service.GeocodingService;
  // placesService: H.service.PlacesService;
  // onSearchSuccess: (result: string[]) => void;

  // constructor() {
  //   // const platform = new H.service.Platform({
  //   //   apikey: process.env.REACT_APP_HERE_APIKEY,
  //   // });

  //   // this.geoCodingService = platform.getGeocodingService();
  //   // this.placesService = platform.getPlacesService();
  // }

  useSuggest = (place: string) => {
    return geocoder
      .suggest({ address: place, language: 'vi' })
      .then(res => res.map(suggest => suggest.formattedAddress));
  };

  useSearch = (place: string) => {
    return geocoder.geocode({ address: place, language: 'vi' }).then(res => {
      return res;
    });
  };
}
