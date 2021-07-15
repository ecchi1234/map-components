import Axios, { AxiosInstance } from 'axios';

const baseURL = `https://places.api.here.com/places/v1/autosuggest?X-Map-Viewport=105.7637,21.0371,105.8006,21.0449&X-Political-View=VNM&app_code=${process.env.REACT_APP_HERE_CODE}&app_id=${process.env.REACT_APP_HERE_ID}&q={search_value}&result_types=address,place&size=5`;

const axios: AxiosInstance = Axios.create();

export interface SuggestLocationInterface {
  category?: string;
  categoryTitle?: string;
  highlightedTitle?: string;
  highlightedVicinity?: string;
  href?: string;
  id?: string;
  position?: number[];
  resultType?: string;
  title?: string;
  type?: string;
  vicinity?: string;
}

export class CustomSearchService {
  public useSuggest = (place: string) => {
    const searchURL = baseURL.replace('{search_value}', place);
    return axios.get(searchURL).then(res => res.data.results);
  };
}
