// This file creates fake versions of Mapbox GL classes for testing.

const MapConstructor = jest.fn(function(options) {
  this.addControl = jest.fn()
  this.remove = jest.fn()
  this.on = jest.fn()
  this.off = jest.fn()
  this.getCanvas = jest.fn(() => ({ style: {} }))
  this.getContainer = jest.fn(() => ({ style: {} }))
})

const MarkerConstructor = jest.fn(function(element) {
  this.element = element
  this.setLngLat = jest.fn().mockReturnThis()
  this.setPopup = jest.fn().mockReturnThis()
  this.addTo = jest.fn().mockReturnThis()
  this.remove = jest.fn()
  this.getElement = jest.fn(() => document.createElement('div'))
})

const PopupConstructor = jest.fn(function() {
  this.setHTML = jest.fn().mockReturnThis()
  this.setLngLat = jest.fn().mockReturnThis()
  this.addTo = jest.fn().mockReturnThis()
  this.remove = jest.fn()
})

class NavigationControl {}

const mapboxgl = {
  accessToken: '',
  Map: MapConstructor,
  Marker: MarkerConstructor,
  Popup: PopupConstructor,
  NavigationControl,
}

module.exports = mapboxgl
module.exports.default = mapboxgl
module.exports.Map = MapConstructor
module.exports.Marker = MarkerConstructor
module.exports.Popup = PopupConstructor
module.exports.NavigationControl = NavigationControl

