
# Learning web development

https://smurphy.uk

This project is just a learning experience. I do not intent to distribute this to end user's but rather track my progress and let other's see. So far, it's been based around learning javascript, html and css to develop websites. In the future, I'll develop using Python frameworks (django, flask) and start integration with DB's. All previous programming experience has not involved web dev. So it's all a bit new.

Basically, this whole project is around getting me familiar with web development and it's various technologies.


## Progress

```python
class Person:
    def __init__(self, name, plans):
        self.name = name
        self.plans = plans

    def timeToLearn(self):
        if len(self.plans) <= 3:
            return True
        else:
            return False

    def output(self):
        if(self.timeToLearn()):
            print(self.name + ' only has '+str(len(self.plans))+' plans. Currently developing REACT API on self hosted nginx server - will be pushed to github soon.')
        else:
            print(self.name+ ' has '+str(len(self.plans))+' he is not developing.')
    
p1 = Person("Shaun",['Developing','Developing','Developing'])
p1.output()
```




## Feedback

If you have any feedback, please reach out to me at shaun.murphy@smurphy.uk

