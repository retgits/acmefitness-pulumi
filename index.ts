import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";

/**
 * Data contains the configuration variables needed to initiate the Pulumi stack
 */
interface Data {
    /**
     * isSingleNode should be set to true when you're using Minikube, Docker for Mac
     * or any other Kubernetes distro that doesn't support services of type LoadBalancer
     */
    isSingleNode: boolean;

    /**
     * dataStorePassword is the default password for all datastores used in the ACME Fitness Shop
     */
    dataStorePassword: string;

    /**
     * frontendPort is the TCP port used to configure the Frontend Service
     */
    frontendPort: number;

    /**
     * usersPort is the TCP port used to configure the Users Service
     */
    usersPort: number;

    /**
     * catalogPort is the TCP port used to configure the Catalog Service
     */
    catalogPort: number;

    /**
     * orderPort is the TCP port used to configure the Order Service
     */
    orderPort: number;

    /**
     * cartPort is the TCP port used to configure the Cart Service
     */
    cartPort: number;

    /**
     * paymentPort is the TCP port used to configure the Payment Service
     */
    paymentPort: number;

    /**
     * frontendNodeport is the TCP port used to expose the Frontend Service
     * to outside the Kubernetes cluster when `isSingleNode` is set to true
     */
    frontendNodeport: number;

    /**
     * posNodeport is the TCP port used to expose the Point-of-Sales Service
     * to outside the Kubernetes cluster
     */
    posNodeport: number;
}

/**
 * Service contains the configuration variables needed for each individual service
 */
interface K8sService {
    name: string;
    service: string;
    portnumber: number;
    portname: string;
    dependency: pulumi.Resource;
}

/**
 * Initialize the configuration from the Pulumi Configuration file
 */
const config = new pulumi.Config();
const kubeVars = config.requireObject<Data>("kubevars")

/**
 * When `isSingleNode` is set to false, this is the configuration for the Frontend Service
 */
const frontendLoadbalancerConfig = {
    port: 80,
    name: "http-frontend",
    protocol: "TCP",
    targetPort: kubeVars.frontendPort,
}

/**
 * When `isSingleNode` is set to true, this is the configuration for the Frontend Service
 */
const frontendNodeportConfig = {
    port: 80,
    name: "http-frontend",
    protocol: "TCP",
    targetPort: kubeVars.frontendPort,
    nodePort: kubeVars.frontendNodeport,
}

/**
 * toBase64 returns a base64 encoded string which can be used in a Kubernetes secret
 * @param s the string to encode
 */
function toBase64(s: string): string {
    return Buffer.from(s).toString("base64");
}

/**
 * Before deploying the different services, default passwords will be created for the service to use in authenticating with the cache. 
 */
const passwords: string[] = ["cart-redis-pass", "catalog-mongo-pass", "order-postgres-pass", "users-redis-pass", "users-mongo-pass"]

for (let password of passwords) {
    let passwd = new k8s.core.v1.Secret(password, {
        metadata: {
            name: password,
            namespace: "default"
        },
        type: "Opaque",
        data: {
            password: toBase64(kubeVars.dataStorePassword),
        }
    })
}

/**
 * Create a config map that contains the initial catalog items
 */
const catalogConfigMap = new k8s.core.v1.ConfigMap("catalog-config-map", {
    metadata: {
        name: "catalog-initdb-config"
    },
    data: {
        "seed.js": `db.catalog.insertMany([
            {"name":"Yoga Mat","shortdescription":"Magic Yoga Mat!","description":"Our Yoga Mat is magic. You will twist into a human pretzel with the greatest of ease. Never done Yoga before? This mat will turn you into an instant professional with barely any work. It’s the American way!. Namaste!","imageurl1":"/static/images/yogamat_square.jpg","imageurl2":"/static/images/yogamat_thumb2.jpg","imageurl3":"/static/images/yogamat_thumb3.jpg","price":62.5,"tags":["mat"]}
            ,{"name":"Water Bottle","shortdescription":"The last Water Bottle you'll ever buy!","description":"Our Water Bottle only has to be filled once! That's right. ONCE. Unlimited water, for the rest of your life. Doesn't that $34.99 seem a lot more reasonable now? Stop buying all those other water bottles that you have to keep refilling like a sucker. Get the ACME bottle today!","imageurl1":"/static/images/bottle_square.jpg","imageurl2":"/static/images/bottle_thumb2.jpg","imageurl3":"/static/images/bottle_thumb3.jpg","price":34.9900016784668,"tags":["bottle"]}
            ,{"name":"Fit Bike","shortdescription":"Get Light on our Fit Bike!", "description":"Ride like the wind on your very own ACME Fit Bike. Have you ever wanted to travel as fast as a MotoGP racer on a bicycle with tiny tires?! Me too! Get the Fit Bike, and you'll vroom your way into fitness in 30 seconds flat!","imageurl1":"/static/images/bicycle_square.jpg","imageurl2":"/static/images/bicycle_thumb2.jpg","imageurl3":"/static/images/bicycle_thumb3.jpg", "price":499.99,"tags":["bicycle"]}
            ,{"name":"Basket Ball","shortdescription":"World's Roundest Basketball!","description":"That's right. You heard me correctly. The worlds ROUNDEST basketball. Are you tired of your current basketball simply not being round enough. Then it's time to step up to the ACME Basketball. Get your round on!","imageurl1":"/static/images/basketball_square.jpg","imageurl2":"/static/images/basketball_thumb2.jpg","imageurl3":"/static/images/basketball_thumb3.jpg","price":110.75,"tags":["basketball"]}
            ,{"name":"Smart Watch","shortdescription":"The watch that makes you smarter!","description":"Do you have trouble remembering things? Can you not remember what day it is? Do you need a robot with a cute women's voice to tell you when to stand up and walk around? Then boy do we have the watch for you! Get the ACME Smart Watch, and never have to remember anything ever again!","imageurl1":"/static/images/smartwatch_square.jpg","imageurl2":"/static/images/smartwatch_thumb2.jpg","imageurl3":"/static/images/smartwatch_thumb3.jpg","price":399.5899963378906,"tags":["watch"]}
            ,{"name":"Red Pants","shortdescription":"Because who doesn't need red pants??", "description":"Have you found yourself walking around tech conferences in the same old jeans and vendor t-shirt? Do you need to up your pants game? ACME Red Pants are 100% GUARANTEED to take you to a whole new level. Women will want to meet you. Men will want to be you. You are... Fancy Pants. What are you waiting for??","imageurl1":"/static/images/redpants_square.jpg","imageurl2":"/static/images/redpants_thumb2.jpg","imageurl3":"/static/images/redpants_thumb3.jpg", "price":99.0,"tags":["clothing"]}
            ,{"name":"Running shoes","shortdescription":"Mama says they was magic shoes!", "description":"And she was right! Are you slow? Out of shape? But still ready to take on Usain Bolt in the 100? Then strap up your ACME Running Shoes and Run Forest, Run! These shoes will make you run the 100 in 2.5 flat!","imageurl1":"/static/images/shoes_square.jpg","imageurl2":"/static/images/shoes_thumb2.jpg","imageurl3":"/static/images/shoes_thumb3.jpg", "price":120.00,"tags":["running"]}
            ,{"name":"Weights","shortdescription":"Get ripped without breaking a sweat!","description":"Are you ready to get Pumped Up with Hanz and Franz? Or get swole like Arnold? It's time to hit the Add to Cart button on the ACME Weights. Just 45 seconds a day, 3 days a week, and you'll be showing those Muscle Beach clowns how it's done in no time!","imageurl1":"/static/images/weights_square.jpg","imageurl2":"/static/images/weights_thumb2.jpg","imageurl3":"/static/images/weights_thumb3.jpg", "price":49.99,"tags":["weight"]} ]);`
    }
})

/**
 * Create a config map that contains the initial users
 */
const usersConfigMap = new k8s.core.v1.ConfigMap("users-config-map", {
    metadata: {
        name: "users-initdb-config"
    },
    data: {
        "seed.js": `db.users.insertMany([
            {"firstname":"Walter","lastname":"White","email":"walter@acmefitness.com","username":"walter","password":"6837ea9b06409112a824d113927ad74fabc5c76e","salt":""}
            ,{"firstname":"Dwight","lastname":"Schrute","email":"dwight@acmefitness.com","username":"dwight","password":"6837ea9b06409112a824d113927ad74fabc5c76e","salt":""}
            ,{"firstname":"Eric","lastname":"Cartman","email":"eric@acmefitness.com","username":"eric","password":"6837ea9b06409112a824d113927ad74fabc5c76e","salt":""}
            ,{"firstname":"Han","lastname":"Solo","email":"han@acmefitness.com","username":"han","password":"6837ea9b06409112a824d113927ad74fabc5c76e","salt":""}
            ,{"firstname":"Phoebe","lastname":"Buffay","email":"phoebe@acmefitness.com","username":"phoebe","password":"6837ea9b06409112a824d113927ad74fabc5c76e","salt":""}
            ,{"firstname":"Elaine","lastname":"Benes","email":"elaine@acmefitness.com","username":"elaine","password":"6837ea9b06409112a824d113927ad74fabc5c76e","salt":""}]);`
    }
})

/**
 * Create a deployment for the redis backend of the cart
 */
const cartRedisDeployment = new k8s.apps.v1.Deployment("cart-redis-deployment", {
    metadata: {
        name: "cart-redis",
        labels: {
            app: "acmefit",
            service: "cart-redis",
            version: "1.0.0",
        },
    },
    spec: {
        selector: {
            // Has to match .spec.template.metadata.labels
            matchLabels: {
                app: "acmefit",
                service: "cart-redis",
            }
        },
        replicas: 1,
        template: {
            // Has to match .spec.selector.matchLabels
            metadata: {
                labels: {
                    app: "acmefit",
                    service: "cart-redis",
                }
            },
            spec: {
                containers: [{
                    name: "cart-redis",
                    image: "bitnami/redis",
                    imagePullPolicy: "Always",
                    resources: {
                        requests: {
                            cpu: "100m",
                            memory: "100Mi",
                        },
                    },
                    ports: [{
                        name: "redis",
                        containerPort: 6379,
                        protocol: "TCP",
                    }],
                    env: [{
                        name: "REDIS_HOST",
                        value: "cart-redis",
                    }, {
                        name: "REDIS_PASSWORD",
                        valueFrom: {
                            secretKeyRef: {
                                name: "cart-redis-pass",
                                key: "password",
                            }
                        }
                    }],
                    volumeMounts: [{
                        mountPath: "/var/lib/redis",
                        name: "cart-redis-data",
                    }]
                }],
                volumes: [{
                    name: "cart-redis-data",
                    emptyDir: {},
                }]
            },
        },
    },
});

/**
 * Create a deployment for the cart service
 */
const cartDeployment = new k8s.apps.v1.Deployment("cart-deployment", {
    metadata: {
        name: "cart",
        labels: {
            app: "acmefit",
            service: "cart",
        },
    },
    spec: {
        selector: {
            matchLabels: {
                app: "acmefit",
                service: "cart",
            }
        },
        replicas: 1,
        strategy: {
            type: "Recreate",
        },
        template: {
            metadata: {
                labels: {
                    app: "acmefit",
                    service: "cart",
                }
            },
            spec: {
                volumes: [{
                    name: "acmefit-cart-data",
                    emptyDir: {},
                }],
                containers: [{
                    image: "gcr.io/vmwarecloudadvocacy/acmeshop-cart:latest",
                    imagePullPolicy: "Always",
                    name: "cart",
                    env: [{
                        name: "REDIS_HOST",
                        value: "cart-redis",
                    }, {
                        name: "REDIS_PASSWORD",
                        valueFrom: {
                            secretKeyRef: {
                                name: "cart-redis-pass",
                                key: "password",
                            }
                        }
                    }, {
                        name: "REDIS_PORT",
                        value: "6379",
                    }, {
                        name: "CART_PORT",
                        value: kubeVars.cartPort.toString(),
                    }, {
                        name: "USER_HOST",
                        value: "users",
                    }, {
                        name: "USER_PORT",
                        value: kubeVars.usersPort.toString(),
                    }, {
                        name: "JAEGER_AGENT_HOST",
                        value: "localhost",
                    }, {
                        name: "JAGER_AGENT_PORT",
                        value: "6831",
                    }, {
                        name: "AUTH_MODE",
                        value: "1",
                    }],
                    ports: [{
                        name: "cart",
                        containerPort: kubeVars.cartPort,
                    }],
                    volumeMounts: [{
                        mountPath: "/data",
                        name: "acmefit-cart-data",
                    }],
                    resources: {
                        requests: {
                            cpu: "100m",
                            memory: "64Mi",
                        }, limits: {
                            cpu: "500m",
                            memory: "256Mi",
                        },
                    },
                }]
            },
        },
    },
});

/**
 * Create a deployment for the mongo backend of the catalog
 */
const catalogMongoDeployment = new k8s.apps.v1.Deployment("catalogmongo-deployment", {
    metadata: {
        name: "catalog-mongo",
        labels: {
            app: "acmefit",
            service: "catalog-db",
        },
    },
    spec: {
        selector: {
            matchLabels: {
                app: "acmefit",
                service: "catalog-db",
            }
        },
        replicas: 1,
        template: {
            metadata: {
                labels: {
                    app: "acmefit",
                    service: "catalog-db",
                }
            },
            spec: {
                containers: [{
                    name: "catalog-mongo",
                    image: "mongo:4",
                    imagePullPolicy: "Always",
                    resources: {},
                    ports: [{
                        name: "catalog-mongo",
                        containerPort: 27017,
                        protocol: "TCP",
                    }],
                    env: [{
                        name: "MONGO_INITDB_ROOT_USERNAME",
                        value: "mongoadmin",
                    }, {
                        name: "MONGO_INITDB_DATABASE",
                        value: "acmefit",
                    }, {
                        name: "MONGO_INITDB_ROOT_PASSWORD",
                        valueFrom: {
                            secretKeyRef: {
                                name: "catalog-mongo-pass",
                                key: "password",
                            }
                        }
                    }],
                    volumeMounts: [{
                        mountPath: "/data/db",
                        name: "mongodata",
                    }, {
                        mountPath: "/docker-entrypoint-initdb.d",
                        name: "mongo-initdb",
                    }]
                }],
                volumes: [{
                    name: "mongodata",
                    emptyDir: {},
                }, {
                    name: "mongo-initdb",
                    configMap: {
                        name: "catalog-initdb-config"
                    },
                }]
            },
        },
    },
}, {
    dependsOn: [catalogConfigMap]
});

/**
 * Create a deployment for the catalog service
 */
const catalogDeployment = new k8s.apps.v1.Deployment("catalog-deployment", {
    metadata: {
        name: "catalog",
        labels: {
            app: "acmefit",
            service: "catalog",
        },
    },
    spec: {
        selector: {
            matchLabels: {
                app: "acmefit",
                service: "catalog",
            }
        },
        replicas: 1,
        strategy: {
            type: "Recreate",
        },
        template: {
            metadata: {
                labels: {
                    app: "acmefit",
                    service: "catalog",
                }
            },
            spec: {
                volumes: [{
                    name: "acmefit-catalog-data",
                    emptyDir: {},
                }],
                containers: [{
                    image: "gcr.io/vmwarecloudadvocacy/acmeshop-catalog:latest",
                    imagePullPolicy: "Always",
                    name: "catalog",
                    env: [{
                        name: "CATALOG_DB_HOST",
                        value: "catalog-mongo",
                    }, {
                        name: "CATALOG_DB_PASSWORD",
                        valueFrom: {
                            secretKeyRef: {
                                name: "catalog-mongo-pass",
                                key: "password",
                            }
                        }
                    }, {
                        name: "CATALOG_DB_PORT",
                        value: "27017",
                    }, {
                        name: "CATALOG_DB_USERNAME",
                        value: "mongoadmin",
                    }, {
                        name: "CATALOG_PORT",
                        value: kubeVars.catalogPort.toString(),
                    }, {
                        name: "CATALOG_VERSION",
                        value: "v1",
                    }, {
                        name: "USERS_HOST",
                        value: "users",
                    }, {
                        name: "USERS_PORT",
                        value: kubeVars.usersPort.toString(),
                    }, {
                        name: "JAEGER_AGENT_HOST",
                        value: "localhost",
                    }, {
                        name: "JAGER_AGENT_PORT",
                        value: "6831",
                    }],
                    ports: [{
                        name: "catalog",
                        containerPort: kubeVars.catalogPort,
                    }],
                    volumeMounts: [{
                        mountPath: "/data",
                        name: "acmefit-catalog-data",
                    }],
                    resources: {
                        requests: {
                            cpu: "100m",
                            memory: "64Mi",
                        }, limits: {
                            cpu: "500m",
                            memory: "256Mi",
                        },
                    },
                }]
            },
        },
    },
});

/**
 * Create a deployment for the payment service
 */
const paymentDeployment = new k8s.apps.v1.Deployment("payment-deployment", {
    metadata: {
        name: "payment",
        labels: {
            app: "acmefit",
            service: "payment",
        },
    },
    spec: {
        selector: {
            matchLabels: {
                app: "acmefit",
                service: "payment",
            }
        },
        replicas: 1,
        strategy: {
            type: "Recreate",
        },
        template: {
            metadata: {
                labels: {
                    app: "acmefit",
                    service: "payment",
                }
            },
            spec: {
                containers: [{
                    image: "gcr.io/vmwarecloudadvocacy/acmeshop-payment:latest",
                    imagePullPolicy: "Always",
                    name: "payment",
                    env: [{
                        name: "PAYMENT_PORT",
                        value: kubeVars.paymentPort.toString(),
                    }, {
                        name: "USERS_HOST",
                        value: "users",
                    }, {
                        name: "USERS_PORT",
                        value: kubeVars.usersPort.toString(),
                    }, {
                        name: "JAEGER_AGENT_HOST",
                        value: "localhost",
                    }, {
                        name: "JAGER_AGENT_PORT",
                        value: "6832",
                    }],
                    ports: [{
                        name: "payment",
                        containerPort: kubeVars.paymentPort,
                    }]
                }]
            },
        },
    },
});

/**
 * Create a deployment for the postgres backend of the order service
 */
const orderPostgresDeployment = new k8s.apps.v1.Deployment("order-postgres-deployment", {
    metadata: {
        name: "order-postgres",
        labels: {
            app: "acmefit",
            service: "order-db",
        },
    },
    spec: {
        selector: {
            // Has to match .spec.template.metadata.labels
            matchLabels: {
                app: "acmefit",
                service: "order-db",
            }
        },
        replicas: 1,
        template: {
            // Has to match .spec.selector.matchLabels
            metadata: {
                labels: {
                    app: "acmefit",
                    service: "order-db",
                }
            },
            spec: {
                containers: [{
                    name: "postgres",
                    image: "postgres:9.5",
                    imagePullPolicy: "Always",
                    ports: [{
                        name: "order-postgres",
                        containerPort: 5432,
                        protocol: "TCP",
                    }],
                    env: [{
                        name: "POSTGRES_USER",
                        value: "pgbench",
                    }, {
                        name: "POSTGRES_PASSWORD",
                        valueFrom: {
                            secretKeyRef: {
                                name: "order-postgres-pass",
                                key: "password",
                            }
                        }
                    }, {
                        name: "PGBENCH_PASSWORD",
                        valueFrom: {
                            secretKeyRef: {
                                name: "order-postgres-pass",
                                key: "password",
                            }
                        }
                    }, {
                        name: "PGDATA",
                        value: "/var/lib/postgresql/data/pgdata",
                    }],
                    volumeMounts: [{
                        mountPath: "/var/lib/postgresql/data",
                        name: "postgredb",
                    }]
                }],
                volumes: [{
                    name: "postgredb",
                    emptyDir: {},
                }]
            },
        },
    },
});

/**
 * Create a deployment for the order service
 */
const orderDeployment = new k8s.apps.v1.Deployment("order-deployment", {
    metadata: {
        name: "order",
        labels: {
            app: "acmefit",
            service: "order",
        },
    },
    spec: {
        selector: {
            matchLabels: {
                app: "acmefit",
                service: "order",
            }
        },
        replicas: 1,
        strategy: {
            type: "Recreate",
        },
        template: {
            metadata: {
                labels: {
                    app: "acmefit",
                    service: "order",
                }
            },
            spec: {
                volumes: [{
                    name: "acmefit-order-data",
                    emptyDir: {},
                }],
                containers: [{
                    image: "gcr.io/vmwarecloudadvocacy/acmeshop-order:latest",
                    imagePullPolicy: "Always",
                    name: "order",
                    env: [{
                        name: "ORDER_DB_HOST",
                        value: "order-postgres",
                    }, {
                        name: "ORDER_DB_PASSWORD",
                        valueFrom: {
                            secretKeyRef: {
                                name: "order-postgres-pass",
                                key: "password",
                            }
                        }
                    }, {
                        name: "ORDER_DB_PORT",
                        value: "5432",
                    }, {
                        name: "AUTH_MODE",
                        value: "1"
                    }, {
                        name: "ORDER_DB_USERNAME",
                        value: "pgbench",
                    }, {
                        name: "PGPASSWORD",
                        valueFrom: {
                            secretKeyRef: {
                                name: "order-postgres-pass",
                                key: "password",
                            }
                        }
                    }, {
                        name: "ORDER_AUTH_DB",
                        value: "postgres",
                    }, {
                        name: "ORDER_PORT",
                        value: kubeVars.orderPort.toString(),
                    }, {
                        name: "PAYMENT_PORT",
                        value: kubeVars.paymentPort.toString(),
                    }, {
                        name: "PAYMENT_HOST",
                        value: "payment",
                    }, {
                        name: "USER_HOST",
                        value: "users",
                    }, {
                        name: "USER_PORT",
                        value: kubeVars.usersPort.toString(),
                    }, {
                        name: "JAEGER_AGENT_HOST",
                        value: "localhost",
                    }, {
                        name: "JAGER_AGENT_PORT",
                        value: "6831",
                    }],
                    ports: [{
                        name: "order",
                        containerPort: kubeVars.orderPort,
                    }],
                    volumeMounts: [{
                        mountPath: "/data",
                        name: "acmefit-order-data",
                    }],
                    resources: {
                        requests: {
                            cpu: "100m",
                            memory: "64Mi",
                        }, limits: {
                            cpu: "500m",
                            memory: "256Mi",
                        },
                    },
                }]
            },
        },
    },
});

/**
 * Create a deployment for the mongo backend of the users
 */
const usersMongoDeployment = new k8s.apps.v1.Deployment("usersmongo-deployment", {
    metadata: {
        name: "users-mongo",
        labels: {
            app: "acmefit",
            service: "users-mongo",
        },
    },
    spec: {
        selector: {
            matchLabels: {
                app: "acmefit",
                service: "users-mongo",
            }
        },
        replicas: 1,
        template: {
            metadata: {
                labels: {
                    app: "acmefit",
                    service: "users-mongo",
                }
            },
            spec: {
                containers: [{
                    name: "users-mongo",
                    image: "mongo:4",
                    imagePullPolicy: "Always",
                    resources: {},
                    ports: [{
                        name: "users-mongo",
                        containerPort: 27017,
                        protocol: "TCP",
                    }],
                    env: [{
                        name: "MONGO_INITDB_ROOT_USERNAME",
                        value: "mongoadmin",
                    }, {
                        name: "MONGO_INITDB_DATABASE",
                        value: "acmefit",
                    }, {
                        name: "MONGO_INITDB_ROOT_PASSWORD",
                        valueFrom: {
                            secretKeyRef: {
                                name: "users-mongo-pass",
                                key: "password",
                            }
                        }
                    }],
                    volumeMounts: [{
                        mountPath: "/data/db",
                        name: "mongodata",
                    }, {
                        mountPath: "/docker-entrypoint-initdb.d",
                        name: "mongo-initdb",
                    }]
                }],
                volumes: [{
                    name: "mongodata",
                    emptyDir: {},
                }, {
                    name: "mongo-initdb",
                    configMap: {
                        name: "users-initdb-config"
                    },
                }]
            },
        },
    },
}, {
    dependsOn: [usersConfigMap]
});

/**
 * Create a deployment for the redis backend of the users
 */
const usersRedisDeployment = new k8s.apps.v1.Deployment("users-redis-deployment", {
    metadata: {
        name: "users-redis",
        labels: {
            app: "acmefit",
            service: "users-redis",
        },
    },
    spec: {
        selector: {
            // Has to match .spec.template.metadata.labels
            matchLabels: {
                app: "acmefit",
                service: "users-redis",
            }
        },
        replicas: 1,
        template: {
            // Has to match .spec.selector.matchLabels
            metadata: {
                labels: {
                    app: "acmefit",
                    service: "users-redis",
                }
            },
            spec: {
                containers: [{
                    name: "users-redis",
                    image: "bitnami/redis",
                    imagePullPolicy: "Always",
                    resources: {
                        requests: {
                            cpu: "100m",
                            memory: "100Mi",
                        },
                    },
                    ports: [{
                        name: "redis",
                        containerPort: 6379,
                        protocol: "TCP",
                    }],
                    env: [{
                        name: "REDIS_HOST",
                        value: "users-redis",
                    }, {
                        name: "REDIS_PASSWORD",
                        valueFrom: {
                            secretKeyRef: {
                                name: "users-redis-pass",
                                key: "password",
                            }
                        }
                    }],
                    volumeMounts: [{
                        mountPath: "/var/lib/redis",
                        name: "users-redis-data",
                    }]
                }],
                volumes: [{
                    name: "users-redis-data",
                    emptyDir: {},
                }]
            },
        },
    },
});

/**
 * Create a deployment for the users service
 */
const usersDeployment = new k8s.apps.v1.Deployment("users-deployment", {
    metadata: {
        name: "users",
        labels: {
            app: "acmefit",
            service: "users",
        },
    },
    spec: {
        selector: {
            matchLabels: {
                app: "acmefit",
                service: "users",
            }
        },
        replicas: 1,
        strategy: {
            type: "Recreate",
        },
        template: {
            metadata: {
                labels: {
                    app: "acmefit",
                    service: "users",
                }
            },
            spec: {
                volumes: [{
                    name: "acmefit-users-data",
                    emptyDir: {},
                }],
                containers: [{
                    image: "gcr.io/vmwarecloudadvocacy/acmeshop-user:latest",
                    imagePullPolicy: "Always",
                    name: "users",
                    env: [{
                        name: "USERS_DB_HOST",
                        value: "users-mongo",
                    }, {
                        name: "USERS_DB_PASSWORD",
                        valueFrom: {
                            secretKeyRef: {
                                name: "users-mongo-pass",
                                key: "password",
                            }
                        }
                    }, {
                        name: "USERS_DB_PORT",
                        value: "27017",
                    }, {
                        name: "USERS_DB_USERNAME",
                        value: "mongoadmin",
                    }, {
                        name: "REDIS_HOST",
                        value: "users-redis",
                    }, {
                        name: "REDIS_PASSWORD",
                        valueFrom: {
                            secretKeyRef: {
                                name: "users-redis-pass",
                                key: "password",
                            }
                        }
                    }, {
                        name: "USER_PORT",
                        value: kubeVars.usersPort.toString(),
                    }, {
                        name: "JAEGER_AGENT_HOST",
                        value: "localhost",
                    }, {
                        name: "JAGER_AGENT_PORT",
                        value: "6831",
                    }],
                    ports: [{
                        name: "users",
                        containerPort: kubeVars.usersPort,
                    }],
                    volumeMounts: [{
                        mountPath: "/data",
                        name: "acmefit-users-data",
                    }],
                    resources: {
                        requests: {
                            cpu: "100m",
                            memory: "64Mi",
                        }, limits: {
                            cpu: "500m",
                            memory: "256Mi",
                        },
                    },
                }]
            },
        },
    },
});

/**
 * Create all services for the deployments
 */
const services: K8sService[] = [
    { name: "cart-redis", service: "cart-redis", portname: "redis-cart", portnumber: 6379, dependency: cartRedisDeployment, },
    { name: "cart", service: "cart", portname: "http-cart", portnumber: kubeVars.cartPort, dependency: cartDeployment, },
    { name: "catalog-mongo", service: "catalog-db", portname: "mongo-catalog", portnumber: 27017, dependency: catalogMongoDeployment, },
    { name: "catalog", service: "catalog", portname: "http-catalog", portnumber: kubeVars.catalogPort, dependency: catalogDeployment, },
    { name: "payment", service: "payment", portname: "http-payment", portnumber: kubeVars.paymentPort, dependency: paymentDeployment, },
    { name: "order-postgres", service: "order-db", portname: "postgres-order", portnumber: 5432, dependency: orderPostgresDeployment, },
    { name: "order", service: "order", portname: "http-order", portnumber: kubeVars.orderPort, dependency: orderDeployment, },
    { name: "users-mongo", service: "users-mongo", portname: "mongo-users", portnumber: 27017, dependency: usersMongoDeployment, },
    { name: "users-redis", service: "users-redis", portname: "redis-users", portnumber: 6379, dependency: usersRedisDeployment, },
    { name: "users", service: "users", portname: "http-users", portnumber: kubeVars.usersPort, dependency: usersDeployment, },
]

for (let service of services) {
    let svc = new k8s.core.v1.Service(service.name + "-service", {
        metadata: {
            name: service.name,
            labels: {
                app: "acmefit",
                service: service.service,
            },
        },
        spec: {
            ports: [{
                port: service.portnumber,
                name: service.portname,
                protocol: "TCP"
            }],
            selector: {
                app: "acmefit",
                service: service.service,
            },
        },
    }, {
        dependsOn: [service.dependency]
    });
}

/**
 * Create a deployment for the frontend service
 */
const frontendDeployment = new k8s.apps.v1.Deployment("frontend-deployment", {
    metadata: {
        name: "frontend",
        labels: {
            app: "acmefit",
            service: "frontend",
        },
    },
    spec: {
        selector: {
            matchLabels: {
                app: "acmefit",
                service: "frontend",
            }
        },
        replicas: 1,
        strategy: {
            type: "Recreate",
        },
        template: {
            metadata: {
                labels: {
                    app: "acmefit",
                    service: "frontend",
                }
            },
            spec: {
                containers: [{
                    image: "gcr.io/vmwarecloudadvocacy/acmeshop-front-end:latest",
                    imagePullPolicy: "Always",
                    name: "frontend",
                    env: [{
                        name: "FRONTEND_PORT",
                        value: kubeVars.frontendPort.toString(),
                    }, {
                        name: "USERS_HOST",
                        value: "users",
                    }, {
                        name: "CATALOG_HOST",
                        value: "catalog",
                    }, {
                        name: "ORDER_HOST",
                        value: "order",
                    }, {
                        name: "CART_HOST",
                        value: "cart",
                    }, {
                        name: "USERS_PORT",
                        value: kubeVars.usersPort.toString(),
                    }, {
                        name: "CATALOG_PORT",
                        value: kubeVars.catalogPort.toString(),
                    }, {
                        name: "ORDER_PORT",
                        value: kubeVars.orderPort.toString(),
                    }, {
                        name: "CART_PORT",
                        value: kubeVars.cartPort.toString(),
                    }, {
                        name: "JAEGER_AGENT_HOST",
                        value: "localhost",
                    }, {
                        name: "JAGER_AGENT_PORT",
                        value: "6832",
                    }],
                    ports: [{
                        name: "frontend",
                        containerPort: kubeVars.frontendPort,
                    }],
                }]
            },
        },
    },
});

/**
 * Create a service for the frontend service
 */
const frontendService = new k8s.core.v1.Service("frontend-service", {
    metadata: {
        name: "frontend",
        labels: {
            app: "acmefit",
            service: "frontend",
        },
    },
    spec: {
        type: kubeVars.isSingleNode ? "NodePort" : "LoadBalancer",
        ports: [kubeVars.isSingleNode ? frontendNodeportConfig : frontendLoadbalancerConfig],
        selector: {
            app: "acmefit",
            service: "frontend",
        },
    },
}, {
    dependsOn: [frontendDeployment]
});

/**
 * Create a deployment for the pos service
 */
const posDeployment = new k8s.apps.v1.Deployment("pos-deployment", {
    metadata: {
        name: "pos",
        labels: {
            app: "acmefit",
            service: "pos",
        },
    },
    spec: {
        selector: {
            matchLabels: {
                app: "acmefit",
                service: "pos",
            }
        },
        replicas: 1,
        strategy: {
            type: "Recreate",
        },
        template: {
            metadata: {
                labels: {
                    app: "acmefit",
                    service: "pos",
                }
            },
            spec: {
                containers: [{
                    image: "gcr.io/vmwarecloudadvocacy/acmeshop-pos:v0.1.0-beta",
                    imagePullPolicy: "Always",
                    name: "pos",
                    env: [{
                        name: "HTTP_PORT",
                        value: "7777",
                    }, {
                        name: "DATASTORE",
                        value: "remote",
                    }, {
                        name: "FRONTEND_HOST",
                        value: "frontend.default.svc.cluster.local",
                    }],
                    ports: [{
                        name: "pos",
                        containerPort: 7777,
                    }],
                }]
            },
        },
    },
});

/**
 * Create a service for the pos service
 */
const posService = new k8s.core.v1.Service("pos-service", {
    metadata: {
        name: "pos",
        labels: {
            app: "acmefit",
            service: "pos",
        },
    },
    spec: {
        type: "NodePort",
        ports: [{
            port: 7777,
            name: "http-pos",
            protocol: "TCP",
            targetPort: 7777,
            nodePort: kubeVars.posNodeport,
        }],
        selector: {
            app: "acmefit",
            service: "pos",
        },
    },
}, {
    dependsOn: [posDeployment]
});

// When "done", this will print the public IP.
export const frontendIP = kubeVars.isSingleNode
    ? "http://localhost:" + frontendNodeportConfig.nodePort
    : "http://" + frontendService.status.loadBalancer.ingress[0].ip;

export const posIP = posService.spec.ports[0].nodePort.apply(port => "http://localhost:" + port)