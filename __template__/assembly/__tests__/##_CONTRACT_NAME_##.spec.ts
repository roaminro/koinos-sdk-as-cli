import { ##_CONTRACT_NAME_## } from '../##_CONTRACT_NAME_##';
import { ##_PROTO_PACKAGE_## } from '../proto/##_PROTO_PACKAGE_##';

describe('contract', () => {
  it("should return 'hello, NAME!'", () => {
    const c = new ##_CONTRACT_NAME_##();

    const args = new ##_PROTO_PACKAGE_##.hello_arguments('World');
    const res = c.hello(args);

    expect(res.value).toStrictEqual('Hello, World!');
  });
});
