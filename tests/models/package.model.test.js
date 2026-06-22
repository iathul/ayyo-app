const moment = require('moment')
const db = require('../setup/db')
const Package = require('../../models/package')

beforeAll(async () => db.connect())
afterEach(async () => db.clearDatabase())
afterAll(async () => db.closeDatabase())

const makePackage = (overrides = {}) => new Package({
  packageId: `package_${Math.random().toString(36).slice(2)}`,
  files: [{ originalname: 'file.txt', size: 10 }],
  package_destination: 'dest',
  package_expiry_date: moment().add(1, 'day'),
  ...overrides
})

describe('Package model', () => {
  it('updatePackageStatus marks the package downloaded and increments the counter', async () => {
    const pkg = await makePackage().save()
    const packageModel = new Package()

    await packageModel.updatePackageStatus(pkg.packageId)

    const updated = await Package.findOne({ packageId: pkg.packageId })
    expect(updated.status).toBe('downloaded')
    expect(updated.package_download_count).toBe(1)
    expect(updated.package_last_download_at).toBeTruthy()
  })

  it('getExpiredPackages only returns packages past their expiry date', async () => {
    const expired = await makePackage({ package_expiry_date: moment().subtract(1, 'day') }).save()
    await makePackage({ package_expiry_date: moment().add(1, 'day') }).save()

    const packageModel = new Package()
    const expiredPackages = await packageModel.getExpiredPackages()

    expect(expiredPackages).toHaveLength(1)
    expect(expiredPackages[0].packageId).toBe(expired.packageId)
  })

  it('deletePackageById removes the package', async () => {
    const pkg = await makePackage().save()
    const packageModel = new Package()

    await packageModel.deletePackageById(pkg.packageId)

    const found = await Package.findOne({ packageId: pkg.packageId })
    expect(found).toBeNull()
  })
})
