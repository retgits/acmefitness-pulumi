import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";

class ACMESecrets extends pulumi.ComponentResource {
    constructor(passwords: string[], secretValue: string, opts?: pulumi.ComponentResourceOptions) {
        super("pulumi:acmefitness:secret", "acmefitness-datastore-passwords", {}, opts);
        passwords.forEach(password => {
            new k8s.core.v1.Secret(password, {
                metadata: {
                    name: password,
                    namespace: "default"
                },
                type: "Opaque",
                data: {
                    password: this.toBase64(secretValue),
                }
            }, { parent: this })
        })
    }

    /**
     * toBase64 returns a base64 encoded string which can be used in a Kubernetes secret
     * @param s the string to encode
     */
    toBase64(s: string): string {
        return Buffer.from(s).toString("base64");
    }
}

export { ACMESecrets };