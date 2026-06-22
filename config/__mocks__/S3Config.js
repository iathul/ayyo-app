module.exports = {
  getObject: jest.fn(),
  deleteObject: jest.fn(() => ({ promise: () => Promise.resolve() }))
}
