# CodeClimate engine for Dockerfilelint

This is a CodeClimate engine that implements a [Dockerfile linter](https://github.com/replicatedhq/dockerfilelint).

## Testing
Start unit tests with `npm test`

## Running

Install the CodeClimate CLI:
```shell
curl -L https://github.com/codeclimate/codeclimate/archive/master.tar.gz | tar xvz
cd codeclimate-* && sudo make install
```

Build this container:
```shell
sudo docker build -t codeclimate/codeclimate-dockerfilelint .
```

Enable this engine in your `.codeclimate.yml` file:
```yml
engines:
  dockerfilelint:
    enabled: true
```

Run the linter in a project that contains files with "Dockerfile" in the title
```shell
sudo codeclimate analyze --dev
```
