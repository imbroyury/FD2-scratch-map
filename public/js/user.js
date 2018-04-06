export default class User {
    constructor () {
        this.isLoggedIn = false;
        this.username = null;
        this.countries = new Map();
        this.colorSettings = {
            visitedColor: '#008000',
            nativeColor: '#FF0000',
            livingColor: '#FFFF00'
        }
    }

    getCurrentNativeCountry() {
        let iterator = this.countries.entries();
        for (let [ISO, status] of iterator) {
            if (status === 'native') return ISO;
        }
        return null;
    }

    getCurrentLivingCountry() {
        let iterator = this.countries.entries();
        for (let [ISO, status] of iterator) {
            if (status === 'living') return ISO;
        }
        return null;
    }

    setNativeCountry(ISO) {
        this.countries.set(ISO, 'native');
    }

    setLivingCountry(ISO) {
        this.countries.set(ISO, 'living');
    }

    addUserCountry(ISO, status, updateDB) {
        this.countries.set(ISO, status);
        if (this.isLoggedIn && updateDB) {
            let url = `/addUserCountry/${this.username}`,
                json = {
                    ISO,
                    status
                };
            fetch(url, {
                credentials: 'include',
                method: 'POST',
                body: JSON.stringify(json),
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        }
    }

    removeUserCountry(ISO, updateDB) {
        this.countries.delete(ISO);
        if (this.isLoggedIn && updateDB) {
            let url = `/removeUserCountry/${this.username}`,
                json = {
                    ISO
                };
            fetch(url, {
                credentials: 'include',
                method: 'POST',
                body: JSON.stringify(json),
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        }
    }

    requestLogInInfo() {
        return new Promise(resolve => {
            fetch('/checklogin', {
                credentials: 'include',
                method: 'GET'
            })
                .then(response => response.json())
                .then(userData => {
                    this.updateUserStatus(userData.isLoggedIn, userData.username);
                    if (userData.isLoggedIn) {
                        this.updateUserColorSettings(JSON.parse(userData.colorSettings));
                    }
                    resolve();
                });
        });
    }

    registerUser(userInfo) {
        return new Promise((resolve, reject) => {
            fetch('/register', {
                credentials: 'include',
                method: 'POST',
                body: JSON.stringify(userInfo),
                headers: {
                    'Content-Type': 'application/json'
                }
            })
                .then(response => response.json())
                .then(json => {
                    if (!json.success) {
                        reject(json.message);
                    } else {
                        resolve(json.message);
                    }
                });
        });
    }

    logIn(userInfo) {
        return new Promise(resolve => {
            fetch('/login', {
                credentials: 'include',
                method: 'POST',
                body: JSON.stringify(userInfo),
                headers: {
                    'Content-Type': 'application/json'
                }
            })
                .then(response => response.json())
                .then(json => resolve(json));
        });
    }

    logOut() {
        return new Promise(resolve => {
            fetch('/logout', {
                credentials: 'include',
                method: 'POST'
            }).then(response => {
                this.updateUserStatus(false, null);
                resolve();
            });
        })
    }

    updateUserStatus(isLoggedIn, username) {
        this.isLoggedIn = isLoggedIn;
        this.username = username;
    }

    updateUserColorSettings(userColorSettings) {
            let {visitedColor, nativeColor, livingColor} = userColorSettings;
            this.colorSettings.visitedColor = visitedColor;
            this.colorSettings.nativeColor = nativeColor;
            this.colorSettings.livingColor = livingColor;
    }

    postUserColorSettings(userColorSettings) {
        return new Promise(resolve => {
            fetch(`/updateSettings/${this.username}`, {
                credentials: 'include',
                method: 'POST',
                body: JSON.stringify(userColorSettings),
                headers: {
                    'Content-Type': 'application/json'
                }
            }).then(response => resolve());
        })
    }

    loadUserCountryData() {
        let url = `/getUserCountries/${this.username}`;
        return new Promise(resolve => {
            fetch(url, {
                credentials: 'include',
                method: 'GET'
            })
                .then(response => response.json())
                .then(json => {
                    resolve(json);
                });
        })
    }
}