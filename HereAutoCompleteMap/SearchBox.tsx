import 'reflect-metadata';
import React, { RefObject, Dispatch, ChangeEvent } from 'react';
import { useCallback } from 'reactn';
import { debounce } from 'core/helpers/debounce';
import { useTranslation } from 'react-i18next';
import { SearchService } from './SearchService';
import {
  CustomSearchService,
  SuggestLocationInterface,
} from './CustomSearchService';

export interface SearchBoxProps {
  map?: H.Map;
  // mapApi: any;
  placeholder?: string;
  onPlacesChanged: Dispatch<React.SetStateAction<any[]>>;
  className?: string;
  defaultAddress?: string;
  onSearchBoxChange?: (value: string) => void;
  disabled?: boolean;
}

export const searchBoxStyle: React.CSSProperties = {
  width: '91%',
  maxHeight: 100,
  minHeight: 50,
  backgroundColor: '#fff',
  position: 'absolute',
  zIndex: 100,
  top: 43,
  left: 32,
  borderRadius: 5,
  boxShadow: '0em 0 0.4em 0 rgba(15, 22, 33, 0.6)',
  overflowY: 'auto',
};

function SearchBox(props: SearchBoxProps) {
  const ref: RefObject<HTMLInputElement> = React.useRef<HTMLInputElement>(null);
  const searchService = React.useRef<SearchService>(null);
  const [translate] = useTranslation();
  const { onPlacesChanged, disabled, onSearchBoxChange } = props;
  const [suggest, setSuggest] = React.useState<SuggestLocationInterface[]>([]);
  const testSearchService = React.useRef<CustomSearchService>(null);

  React.useEffect(() => {
    searchService.current = new SearchService();
    testSearchService.current = new CustomSearchService();
  }, []);

  const handleChoosePlace = React.useCallback(
    (selectedPlace: SuggestLocationInterface) => {
      // searchService.current.useSearch(selectedPlace).then(res => {
      //   onPlacesChanged(res);
      //   setSuggest([]);
      // });
      onPlacesChanged([selectedPlace]);
      setSuggest([]);
    },
    [onPlacesChanged],
  );

  const renderSuggest = React.useMemo(() => {
    return (
      <div style={searchBoxStyle}>
        {suggest.map((suggestItem, index) => (
          <div
            key={index}
            className={'map-suggest-item'}
            title={suggestItem.title}
            onClick={() => handleChoosePlace(suggestItem)}
          >
            {suggestItem.title}
          </div>
        ))}
      </div>
    );
  }, [suggest, handleChoosePlace]);

  const handleChangePlaces = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      // searchService.current
      //   .useSuggest(event.target.value)
      //   .then(res => setSuggest(res))
      //   .catch(() => setSuggest([]));
      testSearchService.current
        .useSuggest(event.target.value)
        .then(res => setSuggest(res))
        .catch(() => setSuggest([]));
    },
    [],
  );

  const handleSearchBoxChange = useCallback(
    debounce((value: string) => {
      ref.current.value = null;
      if (typeof onSearchBoxChange === 'function') {
        onSearchBoxChange(value);
      }
    }),
    [onSearchBoxChange],
  );

  return (
    <div className="input-container">
      <i className="tio-search" />
      <input
        ref={ref}
        type="text"
        className="form-control form-control-sm mb- input-map"
        placeholder={translate('general.actions.searchLocation')}
        disabled={disabled}
        onBlur={(e: ChangeEvent<HTMLInputElement>) =>
          handleSearchBoxChange(e.target.value)
        }
        onChange={handleChangePlaces}
      />
      {suggest.length > 0 && renderSuggest}

      <div></div>
    </div>
  );
}

export default SearchBox;
