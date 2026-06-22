module.exports = {
  sendMailQueue: { add: jest.fn(), process: jest.fn() },
  deletePackageQueue: { add: jest.fn(), process: jest.fn() }
}
