import { System } from "koinos-sdk-as";
import { ##_PROTO_PACKAGE_## } from "./proto/##_PROTO_PACKAGE_##";

export class ##_CONTRACT_NAME_## {
  hello(args: ##_PROTO_PACKAGE_##.hello_arguments): ##_PROTO_PACKAGE_##.hello_result {
    const name = args.name!;

    const res = new ##_PROTO_PACKAGE_##.hello_result();
    res.value = `Hello, ${name}!`;

    System.log(res.value!);

    return res;
  }
}
