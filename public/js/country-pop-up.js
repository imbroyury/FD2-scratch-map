export default class CountryPopUp {
    constructor(countryData, mouseX, mouseY) {
        this.popUp = document.createElement('div');
        this.fillPopUp(countryData, mouseX, mouseY);
        this.appendToPage();
    }

    fillPopUp(countryData, mouseX, mouseY) {
        let wh = window.innerHeight,
            ww = window.innerWidth,
            popupX = mouseX,
            popupY = mouseY;

        if (mouseX > ww / 2) popupX = popupX - 150;
        if (mouseY > wh / 2) popupY = popupY - 150;

        this.popUp.classList.add('popup');
        this.popUp.style.top = popupY + 'px';
        this.popUp.style.left = popupX + 'px';

        if (countryData.status === 404) {
            this.popUp.innerHTML = 'No country data available';
        } else {
            let {name, nativeName, capital, area, population, alpha3Code} = countryData;
            this.popUp.dataset.countryPopUp = alpha3Code;
            this.popUp.innerHTML = `<img src="./flags/${alpha3Code}.svg" class="flag">
                               <div class="country-name">${name}</div>
                               <div>(Native: ${nativeName})</div>
                               <div>Capital: ${capital}</div>
                               <div>Area: ${numberWithComas(area)} km2</div>
                               <div>Population: ${numberWithComas(population)}</div>`;
        }
    }

    appendToPage() {
        document.body.appendChild(this.popUp);
    }

    static clearPopUps() {
        document.querySelectorAll('.popup').forEach(popUp => popUp.remove());
    }
}

function numberWithComas(number) {
    return Number(number) ? number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "???";
}