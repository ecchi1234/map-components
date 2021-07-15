import Map from "components/HereAutoCompleteMap/HereAutoCompleteMap";

<div style={{ height: 300 }} className="mb-5 google-map mt-4">
  <Map
    lat={store.latitude ? store.latitude : 21.027763}
    lng={store.longitude ? store.longitude : 105.83416}
    defaultZoom={10}
    defaultAddress={store.address}
    model={store}
    setModel={setStore}
    isAddress={true}
    placeholder={translate("stores.placeholder.address")}
    onPlacesChanged={handleChangePlace(true)}
  />
</div>;
