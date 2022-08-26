import os
import json
import networkx as nx
from pyvis import network as net

def getGraph(data_dir, task, attributes=['action', 'time', 'submit']):
    TASK = task
    ATTRIBUTES = attributes
    weight_attribute = 'time'
    G = nx.DiGraph()
    nodes = []
    edges = []

    files = os.listdir(data_dir)

    for f in files:
        task_name = "-".join(f.split("-")[:-1])
        if (task_name == TASK):
            json_file = open(os.path.join(data_dir, f))
            json_obj = json.load(json_file)
            current_file_nodes = []
            for i, action in enumerate(json_obj["action_sequence"]):
                current_file_nodes.append(tuple(map(tuple, action["grid"])))
                color = None
                if (i == 0):
                    color = "gray"
                if (action['submit'] > 0):
                    color = "green"
                elif (action['submit'] < 0):
                    color = "red"
                nodes.append((tuple(map(tuple, action["grid"])), {"color" : color}))
                attr = {}
                for selected_attr in ATTRIBUTES:
                    attr[selected_attr] = action[selected_attr]
                attr['weight'] = action[weight_attribute]
                if (i > 0):
                    edges.append((current_file_nodes[i-1], current_file_nodes[i], attr))
    G.add_nodes_from(nodes)
    G.add_edges_from(edges)
    return G

def pyvis_graph(networkx_graph, directed=False, no_label=True, notebook=True, output_filename='graph.html', show_buttons=True, only_physics_buttons=False):
    """
    This function accepts a networkx graph object,
    converts it to a pyvis network object preserving its node and edge attributes,
    and both returns and saves a dynamic network visualization.
    
    Valid node attributes include:
        "size", "value", "title", "x", "y", "label", "color".
        
        (For more info: https://pyvis.readthedocs.io/en/latest/documentation.html#pyvis.network.Network.add_node)
        
    Valid edge attributes include:
        "arrowStrikethrough", "hidden", "physics", "title", "value", "width"
        
        (For more info: https://pyvis.readthedocs.io/en/latest/documentation.html#pyvis.network.Network.add_edge)
        
    
    Args:
        networkx_graph: The graph to convert and display
        notebook: Display in Jupyter?
        output_filename: Where to save the converted network
        show_buttons: Show buttons in saved version of network?
        only_physics_buttons: Show only buttons controlling physics of network?
    """
    
    
    # make a pyvis network
    pyvis_graph = net.Network(notebook=notebook, directed=directed)
    
    # for each node and its attributes in the networkx graph
    for node,node_attrs in networkx_graph.nodes(data=True):
        pyvis_graph.add_node(str(node), label=no_label, **node_attrs)
        
    # for each edge and its attributes in the networkx graph
    for source,target,edge_attrs in networkx_graph.edges(data=True):
        # if value/width not specified directly, and weight is specified, set 'value' to 'weight'
        if not 'value' in edge_attrs and not 'width' in edge_attrs and 'weight' in edge_attrs:
            # place at key 'value' the weight of the edge
            edge_attrs['value']=edge_attrs['weight']
        # add the edge
        pyvis_graph.add_edge(str(source),str(target),**edge_attrs)
        
    # turn buttons on
    if show_buttons:
        if only_physics_buttons:
            pyvis_graph.show_buttons(filter_=['physics'])
        else:
            pyvis_graph.show_buttons()
    
    # return and also save
    pyvis_graph.set_edge_smooth('dynamic')
    return pyvis_graph.show(output_filename)

