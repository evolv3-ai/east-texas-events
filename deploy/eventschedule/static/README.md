# Runtime agent files

No sample feeds are committed. A missing release returns HTTP 404 rather than a successful empty feed.

The publishing workflow creates immutable `releases/<run-id>-<attempt>/` directories and atomically switches the relative `current` symlink. Keep this parent directory mounted at `/srv/static`; do not replace the directory or bind-mount the symlink itself.

See the deployment README for provisioning, migration, verification and rollback.
