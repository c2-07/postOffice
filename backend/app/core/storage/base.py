from abc import ABC, abstractmethod


class BaseStorage(ABC):
    @abstractmethod
    def upload(self,path, stream): ...

    @abstractmethod
    def download(self, path): ...

    @abstractmethod
    def delete(self, path: str): ...
