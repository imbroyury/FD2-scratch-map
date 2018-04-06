import CountryPopUp from './country-pop-up';

const DEF_COLOR_SETTINGS = {
    visitedColor: '#008000',
    nativeColor: '#FF0000',
    livingColor: '#FFFF00'
};

export default class App {
    constructor(user, googleMaps) {
        this.appURL = window.location.origin;
        this.addHashChangeListener();
        this.countriesInfo;
        this.countryList;
        this.countryListDOMForm;
        this.currentUser = user;
        this.googleMaps = googleMaps;
        this.loadingScreen = document.querySelector('.loading-screen');
    }

    // Trigger hash change on page load to display required app section
    triggerHashChangeEvent() {
        if (window.location.hash) {
            window.dispatchEvent(new HashChangeEvent('hashchange', {newURL: window.location.href}));
        }
    }

    loadCountriesInfo() {
        return new Promise(resolve => {
            fetch('/getAllCountriesData')
                .then(data => data.json())
                .then(data => {
                    this.countriesInfo = data[0];
                    this.countryList = new Map();
                    data[1].forEach(countryObject => {
                        let ISO = Object.keys(countryObject)[0];
                        this.countryList.set(ISO, countryObject[ISO]);
                    });
                    resolve();
                });
        });
    }

    // Render navbar based on whether the user is logged in or not
    renderNavbarContent() {
        let menuItem = document.createElement('div');
        menuItem.classList.add('menu-item');
        let navbarMenu = document.querySelector('.navbar-menu');
        navbarMenu.innerHTML = '';

        if (!this.currentUser.isLoggedIn) {
            let login = menuItem.cloneNode(),
                register = menuItem.cloneNode();
            login.innerHTML = `<a href="#login"><span class="fas fa-sign-in-alt"></span><span class="menu-item-text">Log In</span></a>`;
            register.innerHTML = `<a href="#register"><span class="fas fa-user-plus"></span><span class="menu-item-text">Register</span></a>`;
            navbarMenu.append(login, register);
        } else {
            let logout = menuItem.cloneNode(),
                settings = menuItem.cloneNode(),
                statistics = menuItem.cloneNode(),
                welcomeMessage = document.createElement('div');
            logout.innerHTML = `<a href="#logout"><span class="fas fa-sign-out-alt"></span><span class="menu-item-text">Log Out</span></a>`;
            settings.innerHTML = `<a href="#settings"><span class="fas fa-cog"></span><span class="menu-item-text">Settings</span></a>`;
            statistics.innerHTML = `<a href="#statistics"><span class="far fa-user-circle"></span><span class="menu-item-text">Statistics</span></a>`;
            welcomeMessage.classList.add('user-welcome-message');
            welcomeMessage.innerHTML = `Welcome,&nbsp;<span class="username">${this.currentUser.username}</span>`;
            navbarMenu.append(welcomeMessage, settings, statistics, logout);
        }
    }

    renderCountryList() {
        let regionDiv = document.createElement('div'),
            subregionDiv = document.createElement('div'),
            countryDiv = document.createElement('div'),
            form = document.createElement('form');
        regionDiv.classList.add('region');
        subregionDiv.classList.add('subregion');
        countryDiv.classList.add('country');
        form.classList.add('country-list-form');

        let regionList = Object.keys(this.countriesInfo);

        regionList.forEach(region => {
            let crDiv = regionDiv.cloneNode(true);
            crDiv.dataset.region = region;
            crDiv.innerHTML = `<div class="region-name">${region}</div>`;
            form.appendChild(crDiv);

            let subregionList = Object.keys(this.countriesInfo[region]),
                subregionWrapDiv = document.createElement('div');
            subregionWrapDiv.classList.add('subregions-wrap');
            form.querySelector(`.region[data-region='${region}']`).appendChild(subregionWrapDiv);

            subregionList.forEach(subregion => {
                let csrDiv = subregionDiv.cloneNode(true);
                csrDiv.innerHTML = `<div class="subregion-name">${subregion}</div>`;
                csrDiv.dataset.subregion = subregion;
                subregionWrapDiv.appendChild(csrDiv);

                let countryList = this.countriesInfo[region][subregion],
                    countriesWrapDiv = document.createElement('div');
                countriesWrapDiv.classList.add('countries-wrap');
                form.querySelector(`.subregion[data-subregion='${subregion}']`).appendChild(countriesWrapDiv);

                countryList.forEach(country => {
                    let ISO = Object.keys(country)[0],
                        countryName = country[ISO],
                        ccDiv = countryDiv.cloneNode(true);
                    ccDiv.innerHTML = `<input type="checkbox" id="${ISO}-checkbox" name="ISO-code" value="${ISO}">
                                       <label for="${ISO}-checkbox">
                                           <img src='./flags/${ISO}.svg' class="flag-small">
                                           <span class="country-name">${countryName}</span>
                                       </label>`;
                    ccDiv.dataset.iso = ISO;
                    countriesWrapDiv.appendChild(ccDiv);
                });
            });
        });

        // Append rendered form to page
        document.querySelector('.country-list').appendChild(form);
    }

    addHashChangeListener() {
        window.addEventListener('hashchange', e => {
            let {newURL} = e;
            CountryPopUp.clearPopUps();
            App.clearModal();
            if (this.appURL + '/#login' === newURL && !this.currentUser.isLoggedIn) {
                fetchHTML('/html/login.html')
                    .then(form => {
                        let formDiv = form,
                            closeFormButton = formDiv.querySelector('.btn-close-form'),
                            formBody = formDiv.querySelector('.form-body'),
                            errorDiv = formDiv.querySelector('.error-message');

                        function closeFormListener() {
                            App.clearModal();
                            App.removeHash();
                            closeFormButton.removeEventListener('click', closeFormListener);
                            formBody.removeEventListener('submit', submitFormListener);
                        }

                        let submitFormListener = e => {
                            e.preventDefault();
                            let [username, password] = [...e.target.elements];
                            let userInfo = {
                                username: username.value,
                                password: password.value
                            };
                            this.currentUser.logIn(userInfo)
                                .then(userData => {
                                    if (userData.isLoggedIn) {
                                        document.querySelector('.btn-close-form').dispatchEvent(new MouseEvent('click'));
                                        this.showLoadingScreen();
                                        this.clearCountrySelection();
                                        this.currentUser.updateUserStatus(userData.isLoggedIn, userData.username);
                                        this.currentUser.updateUserColorSettings(JSON.parse(userData.colorSettings));
                                        this.googleMaps.changeMapColorSettings(JSON.parse(userData.colorSettings));
                                        this.displayCurrentUserCountries();
                                        closeFormButton.removeEventListener('click', closeFormListener);
                                        formBody.removeEventListener('submit', submitFormListener);
                                        this.renderNavbarContent();
                                        setTimeout(() => this.hideLoadingScreen(), 1000);
                                    } else if (!userData.isLoggedIn) {
                                        displayErrorMessage(userData.message);
                                    }
                                });
                        };

                        closeFormButton.addEventListener('click', closeFormListener);
                        formBody.addEventListener('submit', submitFormListener);

                        function displayErrorMessage(message) {
                            errorDiv.classList.add('visible');
                            errorDiv.innerText = message;
                        }

                        document.body.appendChild(formDiv);
                    });
            } else if (this.appURL + '/#register' === newURL && !this.currentUser.isLoggedIn) {
                fetchHTML('/html/register.html')
                    .then(form => {
                        let formDiv = form,
                            closeFormButton = formDiv.querySelector('.btn-close-form'),
                            formBody = formDiv.querySelector('.form-body'),
                            errorDiv = formDiv.querySelector('.error-message');

                        function closeFormListener() {
                            App.clearModal();
                            App.removeHash();
                            closeFormButton.removeEventListener('click', closeFormListener);
                            formBody.removeEventListener('submit', submitFormListener);
                        }

                        let submitFormListener = e => {
                            e.preventDefault();
                            let [username, email, password, confirmPassword] = [...e.target.elements];
                            if (password.value === confirmPassword.value) {
                                if (password.value.length >= 5) {
                                    let userInfo = {
                                        username: username.value,
                                        email: email.value,
                                        password: password.value,
                                        colorSettings: JSON.stringify(DEF_COLOR_SETTINGS)
                                    };
                                    this.currentUser.registerUser(userInfo)
                                        .then(message => {
                                            closeFormButton.dispatchEvent(new MouseEvent('click'));
                                            closeFormButton.removeEventListener('click', closeFormListener);
                                            formBody.removeEventListener('submit', submitFormListener);
                                        })
                                        .catch(message => displayErrorMessage(message));
                                } else {
                                    displayErrorMessage('Password should contain at least 5 symbols');
                                }
                            } else {
                                displayErrorMessage('Passwords do not match');
                            }

                            function displayErrorMessage(message) {
                                errorDiv.classList.add('visible');
                                errorDiv.innerText = message;
                            }
                        };

                        closeFormButton.addEventListener('click', closeFormListener);
                        formBody.addEventListener('submit', submitFormListener);

                        document.body.appendChild(formDiv);
                    });
            } else if (this.appURL + '/#logout' === newURL && this.currentUser.isLoggedIn) {
                this.showLoadingScreen();
                this.currentUser.logOut()
                    .then(() => {
                        App.removeHash();
                        this.clearCountrySelection();
                        this.renderNavbarContent();
                        this.currentUser.updateUserColorSettings(DEF_COLOR_SETTINGS);
                        this.googleMaps.changeMapColorSettings(DEF_COLOR_SETTINGS);
                        setTimeout(() => this.hideLoadingScreen(), 500);
                    });
            } else if (this.appURL + '/#settings' === newURL && this.currentUser.isLoggedIn) {
                fetchHTML('html/settings.html')
                    .then(form => {
                        let formDiv = form,
                            closeFormButton = formDiv.querySelector('.btn-close-form'),
                            formBody = formDiv.querySelector('.form-body'),
                            errorDiv = formDiv.querySelector('.error-message'),
                            inputColorVisited = formDiv.querySelector('#color-visited'),
                            inputColorNative = formDiv.querySelector('#color-native'),
                            inputColorLiving = formDiv.querySelector('#color-living');

                        inputColorVisited.value = this.currentUser.colorSettings.visitedColor;
                        inputColorNative.value = this.currentUser.colorSettings.nativeColor;
                        inputColorLiving.value = this.currentUser.colorSettings.livingColor;

                        function closeFormListener() {
                            App.clearModal();
                            App.removeHash();
                            closeFormButton.removeEventListener('click', closeFormListener);
                            formBody.removeEventListener('submit', submitFormListener);
                        }

                        let submitFormListener = e => {
                            e.preventDefault();
                            let updatedColorSettings = {
                                visitedColor: inputColorVisited.value,
                                nativeColor: inputColorNative.value,
                                livingColor: inputColorLiving.value
                            };
                            this.currentUser.updateUserColorSettings(updatedColorSettings);
                            this.currentUser.postUserColorSettings(updatedColorSettings);
                            this.googleMaps.changeMapColorSettings(updatedColorSettings, true);

                            closeFormButton.dispatchEvent(new MouseEvent('click'));
                            closeFormButton.removeEventListener('click', closeFormListener);
                            formBody.removeEventListener('submit', submitFormListener);
                        };

                        closeFormButton.addEventListener('click', closeFormListener);
                        formBody.addEventListener('submit', submitFormListener);

                        document.body.appendChild(formDiv);
                    });
            } else if (this.appURL + '/#statistics' === newURL && this.currentUser.isLoggedIn) {
                fetchHTML('html/stats.html')
                    .then(form => {
                        let formDiv = form,
                            closeFormButton = formDiv.querySelector('.btn-close-form'),
                            formBody = formDiv.querySelector('.form-body');

                        if (this.currentUser.countries.size === 0) {
                            formBody.innerHTML = `You haven't marked a single country yet!`;
                        } else {
                            formBody.innerHTML =
                                `<div class="user-statistics-header">You visited ${this.currentUser.countries.size} out of ${this.countryList.size} countries and regions</div>
                                 <progress class="user-statistics-progressbar" value="${this.currentUser.countries.size}" max="${this.countryList.size}"></progress>
                                 <div class="user-statistics-body"></div>`;

                            let regionDiv = document.createElement('div'),
                                subregionDiv = document.createElement('div');
                            regionDiv.classList.add('statistics-region-wrap');
                            subregionDiv.classList.add('statistics-subregion');

                            regionDiv.innerHTML = `<div class="statistics-region"></div><div class="subregions-wrap"></div>`;

                            let regionList = Object.keys(this.countriesInfo);
                            regionList.forEach(region => {
                                let regionCount = 0,
                                    regionVisitedCount = 0,
                                    csrDiv = regionDiv.cloneNode(true),
                                    subregionList = Object.keys(this.countriesInfo[region]);

                                subregionList.forEach(subregion => {
                                    let subregionCount = 0,
                                        subregionVisitedCount = 0,
                                        cssrDiv = subregionDiv.cloneNode(),
                                        countryList = this.countriesInfo[region][subregion];

                                    countryList.forEach(country => {
                                        let ISO = Object.keys(country)[0];
                                        if (this.currentUser.countries.has(ISO)) {
                                            regionVisitedCount++;
                                            subregionVisitedCount++;
                                        }
                                    });

                                    subregionCount = countryList.length;
                                    regionCount += countryList.length;

                                    cssrDiv.innerHTML =
                                        `<div class="name">${subregion}</div>
                                         <div class="stats">
                                            <span class="stats-visited">${subregionVisitedCount}</span> / <span class="stats-total">${subregionCount}</span>
                                         </div>`;

                                    csrDiv.querySelector('.subregions-wrap').appendChild(cssrDiv);
                                });

                                csrDiv.querySelector('.statistics-region').innerHTML =
                                    `<div class="name">${region}</div>
                                     <div class="stats">
                                        <span class="stats-visited">${regionVisitedCount}</span> / <span class="stats-total">${regionCount}</span>
                                     </div>`;

                                formBody.querySelector('.user-statistics-body').appendChild(csrDiv);
                            });
                        }

                        formBody.addEventListener('click', toggleSubregionVisibility);

                        function toggleSubregionVisibility(event) {
                            let clickedElement = event.target,
                                region = clickedElement.closest('.statistics-region');
                            if (region) {
                                region.parentNode.querySelector('.subregions-wrap').classList.toggle('visible');
                            }                            
                        }

                        function closeFormListener() {
                            App.clearModal();
                            App.removeHash();
                            formBody.removeEventListener('click', toggleSubregionVisibility);
                        }

                        closeFormButton.addEventListener('click', closeFormListener, {once: true});
                        document.body.appendChild(formDiv);
                    });
            }
        });
    }

    // Load user countries from DB and display them
    displayCurrentUserCountries() {
        if (this.currentUser.isLoggedIn) {
            this.currentUser.loadUserCountryData()
                .then(data => data.forEach(country => this.setStatusInComponents(country.ISO, country.status, false)));
        }
    }

    addCountryListListeners() {
        this.countryListDOMForm = document.querySelector('.country-list-form');
        this.countryListDOMForm.addEventListener('change', event => {
            let ISO = event.target.id.slice(0, 3),
                checked = event.target.checked;
            checked ? this.loadSelectCountryOptions(ISO) : this.removeStatusInComponents(ISO);
        });

        document.querySelector('.country-list').addEventListener('click', event => {
            let clickedElement = event.target;
            if (clickedElement.classList.contains('region-name')) {
                let subregionsWrap = clickedElement.parentNode.querySelector('.subregions-wrap');
                subregionsWrap.classList.toggle('visible');
                // If we collapsed the whole region, collapse all subregions subsequently
                if (!subregionsWrap.classList.contains('visible')) {
                    [...subregionsWrap.querySelectorAll('.subregion-name')]
                        .forEach(subregionName => subregionName.classList.remove('countries-wrap-visible'));
                    [...subregionsWrap.querySelectorAll('.countries-wrap')]
                        .forEach(countryWrap => countryWrap.classList.remove('visible'));
                }
            } else if (clickedElement.classList.contains('subregion-name')) {
                clickedElement.classList.toggle('countries-wrap-visible');
                clickedElement.parentNode.querySelector('.countries-wrap').classList.toggle('visible');
            }
        });
    }

    setStatusInComponents(ISO, status, updateDB = true) {
        let mapFeatureID = this.countryList.get(ISO).mapFeatureID;
        this.googleMaps.markCountryChosen(mapFeatureID, status);
        this.currentUser.addUserCountry(ISO, status, updateDB);
        this.setListStyling(ISO);
    }

    removeStatusInComponents(ISO, updateDB = true) {
        let mapFeatureID = this.countryList.get(ISO).mapFeatureID;
        this.googleMaps.removeCountryMark(mapFeatureID);
        this.currentUser.removeUserCountry(ISO, updateDB);
        this.removeListStyling(ISO);
    }

    loadVisitTypeForm(ISO) {
        return new Promise((resolve, reject) => {
            fetch('/html/visit.html')
                .then(data => data.text())
                .then(html => {
                    let formDiv = parseHTML(html),
                        country = formDiv.querySelector('.country'),
                        closeFormButton = formDiv.querySelector('.btn-close-form'),
                        formBody = formDiv.querySelector('.form-body');

                    country.innerHTML =
                        `<img src='./flags/${ISO}.svg' class="flag-small">
                         <span class="country-name">${this.countryList.get(ISO).name}</span>`;

                    closeFormButton.addEventListener('click', closeVisitTypeFormListener);
                    formBody.addEventListener('click', optionButtonsListener);

                    document.body.appendChild(formDiv);

                    function closeVisitTypeFormListener() {
                        closeFormButton.removeEventListener('click', closeVisitTypeFormListener);
                        formBody.removeEventListener('click', optionButtonsListener);
                        App.clearModal();
                        reject(ISO);
                    }

                    function optionButtonsListener(event) {
                        if (event.target.tagName === 'BUTTON') {
                            closeFormButton.removeEventListener('click', closeVisitTypeFormListener);
                            formBody.removeEventListener('click', optionButtonsListener);
                            let status = event.target.id.slice(12);
                            App.clearModal();
                            resolve(status);
                        }
                    }
                });
        });
    }

    loadSelectCountryOptions(ISO) {
        this.loadVisitTypeForm(ISO)
            .then(status => {
                if (status === 'native') {
                    let previousISO = this.currentUser.getCurrentNativeCountry();
                    this.currentUser.setNativeCountry(ISO);
                    // Reset previous native country's status to 'visited'
                    if (previousISO) this.setStatusInComponents(previousISO, 'visited')
                } else if (status === 'living') {
                    let previousISO = this.currentUser.getCurrentLivingCountry();
                    this.currentUser.setLivingCountry(ISO);
                    // Reset previous living country's status to 'visited'
                    if (previousISO) this.setStatusInComponents(previousISO, 'visited')
                }
                this.setStatusInComponents(ISO, status);
            })
            .catch(rejectedISO => this.removeStatusInComponents(rejectedISO, false));
    }

    setListStyling(ISO) {
        let input = this.countryListDOMForm.elements.namedItem(`${ISO}-checkbox`),
            country = input.closest('.country'),
            countriesWrap = country.closest('.countries-wrap'),
            subregion = countriesWrap.closest('.subregion'),
            subregionName = subregion.querySelector('.subregion-name'),
            subregionsWrap = subregion.closest('.subregions-wrap'),
            region = subregion.closest('.region'),
            regionName = region.querySelector('.region-name');

        input.checked = true;
        subregionsWrap.classList.add('visible');
        subregionName.classList.add('countries-wrap-visible');
        countriesWrap.classList.add('visible');
        country.classList.add('country-chosen');
        regionName.classList.add('region-chosen');
        subregionName.classList.add('subregion-chosen');
    }

    removeListStyling(ISO) {
        let input = this.countryListDOMForm.elements.namedItem(`${ISO}-checkbox`),
            country = input.closest('.country'),
            countriesWrap = country.closest('.countries-wrap'),
            subregion = countriesWrap.closest('.subregion'),
            subregionName = subregion.querySelector('.subregion-name'),
            region = subregion.closest('.region'),
            regionName = region.querySelector('.region-name');

        input.checked = false;
        country.classList.remove('country-chosen');

        let selectedCountriesInRegion = [...region.querySelectorAll('input')].filter(input => input.checked);
        // If there are no selected countries in the whole region, remove marks on both region and subregion
        if (selectedCountriesInRegion.length === 0) {
            regionName.classList.remove('region-chosen');
            subregionName.classList.remove('subregion-chosen');
        } else {
            // Else if there are no selected countries only in current subregion, remove subregion mark
            let inputedSiblingCountries = [...countriesWrap.querySelectorAll('input')].filter(input => input.checked);
            if (inputedSiblingCountries.length === 0) {
                subregionName.classList.remove('subregion-chosen');
            }
        }
    }

    // Remove currently selected countries before logging new user in and after logging user out
    clearCountrySelection() {
        this.currentUser.countries.forEach((status, ISO) => this.removeStatusInComponents(ISO));
        this.collapseCountryList();
    }

    // Remove expanded list related classes
    collapseCountryList() {
        let subregionsWrap = [...this.countryListDOMForm.querySelectorAll('.subregions-wrap')],
            subregionName = [...this.countryListDOMForm.querySelectorAll('.subregion-name')],
            countriesWrap = [...this.countryListDOMForm.querySelectorAll('.countries-wrap')];
        subregionsWrap.forEach(element => element.classList.remove('visible'));
        subregionName.forEach(element => element.classList.remove('countries-wrap-visible'));
        countriesWrap.forEach(element => element.classList.remove('visible'));
    }

    showLoadingScreen() {
        this.loadingScreen.classList.remove('hidden');
    }

    hideLoadingScreen() {
        this.loadingScreen.classList.add('hidden');
    }

    static clearModal() {
        let modal = document.querySelector('.modal-overlay');
        if (modal) modal.remove();
    }

    static removeHash() {
        history.pushState('', document.title, window.location.pathname + window.location.search);
    }
}

function fetchHTML(link) {
    return new Promise(resolve => {
       fetch(link)
           .then(response => response.text())
           .then(text => parseHTML(text))
           .then(html => resolve(html));
    });
}

function parseHTML(text) {
    let parser = new DOMParser(),
        doc = parser.parseFromString(text, 'text/html');
    return doc.body.firstChild;
}