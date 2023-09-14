export async function requestGenerateattributes(
  url: string,
  id: string,
  attributes: string
) {
  const formData = new FormData();
  formData.append("id", "semaphore-id-"+id.slice(0, 8));
  formData.append("attriblist", attributes);
  const response = await fetch(url + "/generateattributes", {
    method: "POST",
    body: formData,
  });
  return response.json();
}

export async function requestSign(
  url: string,
  id: string,
  attributes: string,
  policy: string,
  message: string,
) {
  const formData = new FormData();
  formData.append("id", "semaphore-id-"+id.slice(0, 8));
  formData.append("attriblist", attributes);
  formData.append("message", message);
  formData.append("policy", policy);
  const response = await fetch(url + "/sign", {
    method: "POST",
    body: formData,
  });
  return response.json();
}

export async function requestverify(
  url: string,
  id: string,
  policy: string,
  signedMessage: string,
) {
  const formData = new FormData();
  formData.append("id", "semaphore-id-"+id.slice(0, 8));
  formData.append("message", signedMessage)
  formData.append("signpolicy", policy)
  formData.append("policy", policy)
  const response = await fetch(url + "/verify", {
    mode: 'cors',
    method: "POST",
    body: formData,
  });
  return response.json();
}