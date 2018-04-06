// GMaps API key AIzaSyCe6Nb5vWck7juVE44B16d96cEnCCPtOf8
import CountryPopUp from './country-pop-up';

export default class GoogleMap {
    constructor(mapWrapper) {
        this.colorSettings = {
            basicColor: 'transparent',
            basicHoverColor: '#cfeef9',
            visitedColor: '#008000',
            visitedHoverColor: shadeColor('#008000', 0.2),
            nativeColor: '#FF0000',
            nativeHoverColor: shadeColor('#FF0000', 0.2),
            livingColor: '#FFFF00',
            livingHoverColor: shadeColor('#FFFF00', 0.2)
        };
        this.mapWrapper = mapWrapper;
        this.initMap();
        this.popUpTimeoutID;
    }


    initMap() {
        // Define new google map
        this.gMap = new google.maps.Map(this.mapWrapper, {
            minZoom: 2,
            zoom: 4,
            center: {lat: 53, lng: 27},
            gestureHandling: 'greedy',
            fullscreenControl: false,
            streetViewControl: false
        });

        // Set the stroke width, and fill color for each polygon
        this.gMap.data.setStyle({
            fillColor: this.colorSettings.basicColor,
            strokeWeight: 0.2
        });
    }

    loadGeoJSON() {
        return new Promise(resolve => {
            fetch('../countries/countriesGEO.json', {
                credentials: 'include',
                method: 'GET'
            })
                .then(data => data.json())
                .then(geoJSON => resolve(geoJSON));
        });
    }

    displayGeoJSON(geoJSON) {
        return new Promise(resolve => {
            this.gMap.data.addGeoJson(geoJSON);
            resolve();
        });
    }

    addMapListeners(app) {
        this.gMap.data.addListener("mouseover", event => {
            this.clearPopUpTimeout();
            let feature = event.feature;
            if (feature.getProperty('chosenCountry')) {
                let status = feature.getProperty('status');
                if (status === 'visited') {
                    this.gMap.data.overrideStyle(feature, {fillColor: this.colorSettings.visitedHoverColor});
                } else if (status === 'native') {
                    this.gMap.data.overrideStyle(feature, {fillColor: this.colorSettings.nativeHoverColor});
                } else if (status === 'living') {
                    this.gMap.data.overrideStyle(feature, {fillColor: this.colorSettings.livingHoverColor});
                }
            } else {
                this.gMap.data.overrideStyle(feature, {fillColor: this.colorSettings.basicHoverColor});
            }
            this.popUpTimeoutID = setTimeout(() => {
                fetchCountryData(event.feature.f.ISO_A3)
                    .then(countryJSONData => new CountryPopUp(countryJSONData, event.Fa.x, event.Fa.y));
            }, 800);

        });

        this.gMap.data.addListener("mouseout", event => {
            this.clearPopUpTimeout();
            let feature = event.feature;
            if (feature.getProperty('chosenCountry')) {
                let status = event.feature.getProperty('status');
                if (status === 'visited') {
                    this.gMap.data.overrideStyle(feature, {fillColor: this.colorSettings.visitedColor});
                } else if (status === 'native') {
                    this.gMap.data.overrideStyle(feature, {fillColor: this.colorSettings.nativeColor});
                } else if (status === 'living') {
                    this.gMap.data.overrideStyle(feature, {fillColor: this.colorSettings.livingColor});
                }
            } else {
                this.gMap.data.overrideStyle(feature, {fillColor: this.colorSettings.basicColor});
            }
        });

        this.gMap.addListener('drag', event => this.clearPopUpTimeout());

        this.gMap.data.addListener("click", event => {
            let feature = event.feature;
            if (!feature.getProperty('chosenCountry')) {
                app.loadSelectCountryOptions(feature.getProperty('ISO_A3'));
            } else {
                app.removeStatusInComponents(feature.getProperty('ISO_A3'));
            }
        });
    }
    
    markCountryChosen(featureID, status) {
        let feature = this.gMap.data.getFeatureById(featureID);
        feature.setProperty('chosenCountry', true);
        feature.setProperty('status', status);
        if (status === 'visited') {
            this.gMap.data.overrideStyle(feature, {fillColor: this.colorSettings.visitedColor});
        } else if (status === 'native') {
            this.gMap.data.overrideStyle(feature, {fillColor: this.colorSettings.nativeColor});
        } else if (status === 'living') {
            this.gMap.data.overrideStyle(feature, {fillColor: this.colorSettings.livingColor});
        }
    }
    
    removeCountryMark(featureID) {
        let feature = this.gMap.data.getFeatureById(featureID);
        feature.setProperty('chosenCountry', false);
        feature.setProperty('status', null);
        this.gMap.data.overrideStyle(feature, {fillColor: this.colorSettings.basicColor});
    }

    clearPopUpTimeout() {
        clearTimeout(this.popUpTimeoutID);
        CountryPopUp.clearPopUps();
    }

    changeMapColorSettings(colorSettings, shouldReapply = false) {
        this.colorSettings.visitedColor = colorSettings.visitedColor;
        this.colorSettings.visitedHoverColor = shadeColor(colorSettings.visitedColor, 0.2);
        this.colorSettings.nativeColor = colorSettings.nativeColor;
        this.colorSettings.nativeHoverColor = shadeColor(colorSettings.nativeColor, 0.2);
        this.colorSettings.livingColor = colorSettings.livingColor;
        this.colorSettings.livingHoverColor = shadeColor(colorSettings.livingColor, 0.2);
        if (shouldReapply) {
            this.reapplyMapColorStyling();
        }
    }

    reapplyMapColorStyling() {
        this.gMap.data.forEach(feature => {
            let status = feature.getProperty('status');
            if (status === 'visited') {
                this.gMap.data.overrideStyle(feature, {fillColor: this.colorSettings.visitedColor});
            } else if (status === 'native') {
                this.gMap.data.overrideStyle(feature, {fillColor: this.colorSettings.nativeColor});
            } else if (status === 'living') {
                this.gMap.data.overrideStyle(feature, {fillColor: this.colorSettings.livingColor});
            }
        });
    }
}

function fetchCountryData(ISO_A3) {
    let url = `/getCountryData/${ISO_A3}`;
    return new Promise(resolve => {
        fetch(url, {
            credentials: 'include',
            method: 'GET'
        })
            .then(data => data.json())
            .then(countryJSONData => resolve(countryJSONData));
    });
}


/*
 * https://stackoverflow.com/questions/5560248/programmatically-lighten-or-darken-a-hex-color-or-rgb-and-blend-colors
 */
function shadeColor(color, percent) {
    let f = parseInt(color.slice(1), 16), t = percent < 0 ? 0 : 255, p = percent < 0 ? percent * -1 : percent,
        R = f >> 16, G = f >> 8 & 0x00FF, B = f & 0x0000FF;
    return "#" + (0x1000000 + (Math.round((t - R) * p) + R) * 0x10000 + (Math.round((t - G) * p) + G) * 0x100 + (Math.round((t - B) * p) + B)).toString(16).slice(1);
}