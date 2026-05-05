# Hummingbird Extension for Podman Desktop

This extension integrates the [Hummingbird project](https://hummingbird-project.io/) hardened images to Podman Desktop.

## Features

### Hummingbird Catalog

The Podman Desktop Hummingbird extension allows you to directly list the Hummingbird hardened images
from withing Podman Desktop and pull them.

![hummingbird-catalog-dark.png](screenshots/hummingbird-catalog-dark.png)

### Alternative page

As the extension is integrated in Podman Desktop, it can scan your local registry and directly suggest alternative
images. 

Combined with the [Grype](https://github.com/podman-desktop/extension-grype) extension, you will be able to compare the
image and their alternatives, comparing image size and number of CVEs.

![hummingbird-alt-dark.png](screenshots/hummingbird-alt-dark.png)

You can get detailed insight on the alternative and the base image in the dedicated details page

![hummingbird-alt-details-dark.png](screenshots/hummingbird-alt-details-dark.png)

### Cloning

Listing image is great, but we also detect the containers that are using an image with a hardened alternative.
From the Hummingbird extension, you can take an existing container and clone its config to use with a Hummingbird image.

![hummingbird-clone-dark.png](screenshots/hummingbird-clone-dark.png)
