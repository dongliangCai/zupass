export async function requestGenerateattributes(
  url: string,
  id: string,
  attributes: string
) {
  const response = await fetch(url + "/generateattributes", {
    method: "POST",
    body: JSON.stringify({id: id, attributes: attributes}),
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });
  return response.json();
}

export async function requestverify(
  url: string,
  id: string,
  attributes: string
) {
  const response = await fetch(url + "/verify", {
    method: "POST",
    body: JSON.stringify({id: id, attributes: attributes}),
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });
  return response.json();
}

