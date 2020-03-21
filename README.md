# ACME Fitness Shop :: K8s

The [ACME Fitness Shop](https://github.com/vmwarecloudadvocacy/acme_fitness_demo) is a Polyglot demo application comprised of (presently) 6 microservices and 4 datastores. In this folder you'll find the TypeScript based Pulumi code to deploy the ACME Fitness Shop application in a kubernetes cluster. The app is developed by team behind [cloudjourney.io](https://cloudjourney.io)

The current version of the application passes JSON Web Tokens (JWT) for authentication on certain API calls. The application will not work as expected if the `users` service is not present to issue / authenticate these tokens.

## Prerequisites

* [TypeScript v3.7.2 or higher](https://www.typescriptlang.org/download)
* [Node.js v13.11.0 or higher](https://nodejs.org/en/download/)
* [A Pulumi account](https://app.pulumi.com/signup)
* A Kubernetes cluster (any cluster, including Docker for Mac or Minikube, will work)

## Initialize the stack

To start, you'll need to create an empty stack with whatever name you choose. The stack will have no resources yet, but in the following steps you'll add the microservices, datastores, and secrets to your stack and cluster.

```bash
$ pulumi stack init dev
Created stack 'dev'
```

## Configuration

The file `Pulumi.dev.yaml` contains the configuration for the ACME Fitness Shop. Based on your requirements, you can update these to your desired settings.

```yaml
config:
  acmefitness:kubevars:
    ## isSingleNode should be set to true when you're using Minikube, Docker for Mac
    ## or any other Kubernetes distro that doesn't support services of type LoadBalancer
    isSingleNode: true

    ## dataStorePassword is the default password for all datastores used in the ACME Fitness Shop
    dataStorePassword: helloworld

    ## frontendPort is the TCP port used to configure the Frontend Service
    frontendPort: 3000

    ## usersPort is the TCP port used to configure the Users Service
    usersPort: 8083

    ## catalogPort is the TCP port used to configure the Catalog Service
    catalogPort: 8082

    ## orderPort is the TCP port used to configure the Order Service
    orderPort: 6000

    ## cartPort is the TCP port used to configure the Cart Service
    cartPort: 5000

    ## paymentPort is the TCP port used to configure the Payment Service
    paymentPort: 9000

    ## frontendNodeport is the TCP port used to expose the Frontend Service
    ## to outside the Kubernetes cluster when `isSingleNode` is set to true
    frontendNodeport: 30430

    ## posNodeport is the TCP port used to expose the Point-of-Sales Service
    ## to outside the Kubernetes cluster
    posNodeport: 30431
```

## Deploy the stack

To deploy the stack, run

```bash
$ npm install

$ pulumi up
Previewing update (bla):
     Type                           Name                       Plan
 +   pulumi:pulumi:Stack            acmefitness-bla            create..
 +   ├─ kubernetes:core:ConfigMap   catalog-config-map         create
 +   ├─ kubernetes:core:ConfigMap   users-config-map           create
 +   ├─ kubernetes:apps:Deployment  frontend-deployment        create
 +   ├─ kubernetes:apps:Deployment  pos-deployment             create
 +   ├─ kubernetes:apps:Deployment  order-postgres-deployment  create
 +   ├─ kubernetes:apps:Deployment  payment-deployment         create
 +   ├─ kubernetes:core:Secret      users-mongo-pass           create
 +   ├─ kubernetes:apps:Deployment  users-redis-deployment     create
 +   ├─ kubernetes:core:Secret      users-redis-pass           create
 +   ├─ kubernetes:core:Secret      order-postgres-pass        create
 +   ├─ kubernetes:apps:Deployment  cart-redis-deployment      create
 +   ├─ kubernetes:apps:Deployment  users-deployment           create
 +   ├─ kubernetes:core:Secret      catalog-mongo-pass         create
 +   ├─ kubernetes:apps:Deployment  cart-deployment            create
 +   ├─ kubernetes:apps:Deployment  catalog-deployment         create
 +   ├─ kubernetes:apps:Deployment  catalogmongo-deployment    create
 +   ├─ kubernetes:core:Service     frontend-service           create
 +   ├─ kubernetes:apps:Deployment  usersmongo-deployment      create
 +   ├─ kubernetes:core:Service     pos-service                create
 +   ├─ kubernetes:core:Service     order-postgres-service     create
 +   ├─ kubernetes:core:Service     users-service              create
 +   ├─ kubernetes:core:Service     cart-redis-service         create
 +   ├─ kubernetes:core:Service     users-redis-service        create
 +   ├─ kubernetes:core:Service     payment-service            create
 +   ├─ kubernetes:core:Service     cart-service               create
 +   ├─ kubernetes:core:Service     users-mongo-service        create
 +   ├─ kubernetes:core:Service     catalog-mongo-service      create
 +   ├─ kubernetes:core:Service     catalog-service            create
 +   ├─ kubernetes:apps:Deployment  order-deployment           create
 +   └─ kubernetes:core:Service     order-service              create

Resources:
    + 32 to create

Do you want to perform this update?
  yes
> no
  details
```

Select *yes* to perform the update and install the ACME Fitness Shop to your cluster.

## Accessing the ACME Fitness Shop

After the deployment is done, you can find the IP addresses of the frontend service and the Point-of-Sales service by running `pulumi stack output`

```bash
$ pulumi stack output
Current stack outputs (2):
    OUTPUT      VALUE
    frontendIP  http://localhost:30430
    posIP       http://localhost:30431
```

The default settings will create a *nodePort* for both the frontend service and the Point-of-Sales service that are accessible on the local host.
