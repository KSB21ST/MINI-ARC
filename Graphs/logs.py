# dash + visdcc imoprts
from platform import node
import dash
import visdcc
from dash import dcc
from dash import html
import dash_cytoscape as cyto
from dash.dependencies import Input, Output, State

from utils import *

log_graph = getGraph(data_dir = "../data/MiniARC_Logs", task="Minhyuk_TopPoint_l6aei8s9pjo8fioevd")
pyvis_graph(log_graph, directed=True, no_label=True)

styles = {
    'pre': {
        'border': 'thin lightgrey solid',
        'overflowX': 'scroll'
    }
}

app = dash.Dash()
nodes = log_graph.nodes
edges = log_graph.edges

hashdict = {hash(node): node for (id, node) in enumerate(nodes)}

cyto_nodes = [{'data': {'id': str(hash(node)), 'label': str(hash(node))}} for id, node in enumerate(nodes)]
cyto_edges = [{'data': {'source': str(hash(source)), 'target': str(hash(target))}} for id, (source, target) in enumerate(edges)]

app.layout = html.Div([
    cyto.Cytoscape(
        id='net', 
        elements=cyto_nodes+cyto_edges, 
        layout={'name': 'breadthfirst', 'directed': True}, 
        style={'width': '100%', 'height': '450px'}
    ),
    html.Pre(id='node-json', style=styles['pre'])
])

@app.callback(Output('node-json', 'children'),
              Input('net', 'tapNodeData'))
def displayTapNodeData(data):
    grid = hashdict[int(data['id'])]
    grid_string = ""
    for row in grid:
        for elem in row:
            grid_string += str(elem)
        grid_string += "\n"
    return grid_string

if __name__ == '__main__':
    app.run_server(debug=True)



        
