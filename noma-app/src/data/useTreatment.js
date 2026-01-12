// use treatment.js

import treatments from '../../assets/data/treatments.json'


export function getAllTreatments() {
    return treatments;
}

export function getByCrop(crop) {
    return treatments.filter(t => t.crop.toLowerCase() === crop.toLowerCase());
}

export function getById(id) {
    return treatments.find(t => t.id === id);
}