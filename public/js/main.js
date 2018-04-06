import GoogleMap from './map.js';
import App from './app.js';
import User from './user';
import less from '../less/styles.less';

const mapDiv = document.getElementById('google-maps');
const googleMaps = new GoogleMap(mapDiv);
const user = new User();
const app = new App(user, googleMaps);


async function loadComponents() {
    await Promise.all([
        googleMaps.loadGeoJSON()
            .then(geoJSON => googleMaps.displayGeoJSON(geoJSON))
            .then(() => googleMaps.addMapListeners(app)),

        app.loadCountriesInfo()
            .then(() => {
                app.renderCountryList();
                app.addCountryListListeners();
            })
            .then(() => user.requestLogInInfo())
            .then(() => {
                googleMaps.changeMapColorSettings(user.colorSettings);
                app.renderNavbarContent();
            })
    ]);

    app.displayCurrentUserCountries();
    setTimeout(() => {
        app.triggerHashChangeEvent();
        app.hideLoadingScreen();
    }, 500);
}

document.addEventListener("DOMContentLoaded", () => loadComponents());
