import {
  ApolloClient,
  ApolloLink,
  HttpLink,
  InMemoryCache,
  NormalizedCacheObject,
  Operation,
  split,
} from "@apollo/client";
import { asyncMap } from "@apollo/client/utilities";
import { decryptName } from "@app/api/labels";
import { bracketFormat, truncateFormat } from "@app/utils/utils";
import { Observable } from "zen-observable-ts";
import resolvers from "../api/resolvers";
import { networkIdReactive } from "./reactiveVars";
import typePolicies from "./typePolicies";

let client: ApolloClient<NormalizedCacheObject>;

const cache = new InMemoryCache({ typePolicies });

const endpoints: Record<number, string> = {
  1: "https://api.thegraph.com/subgraphs/name/ensdomains/ens",
  3: "https://api.thegraph.com/subgraphs/name/ensdomains/ensropsten",
  4: "https://api.thegraph.com/subgraphs/name/ensdomains/ensrinkeby",
  5: "https://api.thegraph.com/subgraphs/name/ensdomains/ensgoerli",
};

function getGraphQLAPI(): string {
  const network = networkIdReactive() as number;

  if (process.env.NEXT_PUBLIC_GRAPH_URI) {
    return process.env.NEXT_PUBLIC_GRAPH_URI;
  }

  if (endpoints[network]) {
    return endpoints[network];
  }

  return endpoints[1];
}

function fromPromise(promise: Promise<any>, operation: Operation) {
  return new Observable((observer) => {
    promise
      .then((value) => {
        operation.setContext({ response: value });
        observer.next({
          data: { [operation.operationName]: value },
          errors: [],
        });
        observer.complete();
      })
      .catch((e) => {
        console.error("fromPromise error: ", e);
        observer.error.bind(observer);
      });
  });
}

export function setupClient() {
  const httpLink = new HttpLink({
    uri: () => getGraphQLAPI(),
  });

  const web3Link = new ApolloLink(
    (operation: Operation): Observable<any> | null => {
      const { variables, operationName } = operation;

      if (resolvers.Query[operationName]) {
        return fromPromise(
          resolvers.Query[operationName]?.apply(null, [
            null,
            variables,
            client,
          ]),
          operation
        );
      }
      return null;
    }
  );

  const formatUnknownLink = new ApolloLink(
    (operation: Operation, forward: any) => {
      return asyncMap(forward(operation), async (response: any) => {
        const originalData =
          response.data &&
          (response.data[operation.operationName] ||
            response.data[Object.keys(response.data)[0]]);
        let returnable = Array.isArray(originalData)
          ? [...originalData]
          : {
              ...originalData,
            };

        const traverseObj = async (obj: Object): Promise<any> => {
          const newObj: any = obj;
          if (obj) {
            Object.entries(obj).forEach(async ([key, value]) => {
              if (typeof value === "string" && key === "name") {
                newObj.name = decryptName(value);
                newObj.name = bracketFormat(newObj.name);
                newObj.formattedName = truncateFormat(newObj.name);
                return;
              }
              if (typeof value === "object") {
                newObj[key] = await traverseObj(value);
              }
            });
          }
          return newObj;
        };

        if (returnable && typeof returnable === "object") {
          returnable = await traverseObj(returnable);
          return {
            ...response,
            data: {
              ...response.data,
              [operation.operationName || Object.keys(response.data)[0]]:
                returnable,
            },
          };
        }

        return response;
      });
    }
  );

  const splitLink = split(
    ({ operationName }) => {
      return (
        resolvers.Query[operationName] || resolvers.Mutation[operationName]
      );
    },
    web3Link,
    httpLink
  );

  const option = {
    cache,
    link: formatUnknownLink.concat(splitLink),
    connectToDevTools: true,
  };

  client = new ApolloClient(option);
}

export default function getClient() {
  return client;
}
