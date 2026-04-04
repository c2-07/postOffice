from abc import ABC, abstractmethod


class Base(ABC):
    @classmethod
    @abstractmethod
    def sayHello(cls): ...

    @classmethod
    def bark(cls):
        print("Bark Nigga")


class First(Base):
    def sayHello(cls):
        cls.bark
        print("Hello !")


first = First()
First().bark()
first.sayHello()
